import { DynoSvg } from "./DynoSvg.js";
import { DynoConfig } from "./DynoConfig.js";
import { get_colors, convert_hsla_text_to_array} from "./DynoTools.js";
import { DynoAxis } from "./DynoAxis.js";


const COLOR_COUNT = 10;
const BLOCK_SIZE = 10;
const SMOOTH_MIN = 0.00001;

export class DynoHeatmap{
    /**
     * @param {string|HTMLDivElement} id
     * @param {DynoConfig} config
     * @param {number[][]} data
     */
    constructor(id, data, config){
        this.svg = new DynoSvg(id);
        this.config = config;
        this.data = data;

        this.range = {"x": {'min':0, 'max': 0}, "y": {'min':0, 'max': 0}, 'data': {'min':0, 'max': 0}};                
        this._calc_range();

        this.color = [];
        let color_text = get_colors(this.config.color_schemes, 'heatmap', 0.5, COLOR_COUNT).reverse();
        for (let idx=0;idx<color_text.length;idx++){
            this.color.push(convert_hsla_text_to_array(color_text[idx]));
        }
        this._draw();
        this.svg.add_resize_callback(this._draw.bind(this), true);
    }

    /**
     * @param {number|undefined} value
     * @return {number}
     */
    _undefined_to_number(value){
        return (typeof value === 'undefined') ? 0 : value;
    }

    _calc_range(){
        this.range.data.min = 0;
        this.range.data.max = 0;        
        let y_size = this.data.length;
        let x_size = this.data[0].length;
        for (let idx=0;idx<this.data.length;idx++){
            this.range.data.max = Math.max(this.range.data.max, ...this.data[idx]);
            this.range.data.min = Math.min(this.range.data.min, ...this.data[idx]);
            if (x_size != this.data[idx].length){
                console.error('Data Must be a square matrix. Data is being clipped');
                x_size = Math.min(x_size, this.data[idx].length);
            }
        }

        this.range.x.min = 0;
        this.range.x.max = x_size-1;
        this.range.y.min = 0;
        this.range.y.max = y_size-1;        
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    _get_color(x, y){        
        let value = this.data[y][x];
        let color_pos = ((value - this.range.data.min) / (this.range.data.max - this.range.data.min)) * (COLOR_COUNT-1);
        color_pos = Math.round(color_pos);        
        return this.color[color_pos];
    }

    /**
     * @param {{ x: number; y: number; }} point1
     * @param {{ x: number; y: number; }} point2
     */
    _distance(point1, point2){
        let x_sq = (point1.x-point2.x) ** 2;
        let y_sq = (point1.y-point2.y) ** 2;

        return Math.sqrt(x_sq + y_sq);
    }


    /**
     * @param {{x: number, y: number}} point_top_left
     * @param {{x: number, y: number}} point_bottom_right
     * @param {{x: number, y: number, color: {}}[]} edge_colors
     */
    _fill_box(point_top_left, point_bottom_right, edge_colors){       
        let color_keys = ['hue', 'saturation', 'light', 'alpha'];        
        
        for (let y=point_top_left.y;y<point_bottom_right.y;y=y+BLOCK_SIZE){
            for (let x=point_top_left.x;x<point_bottom_right.x;x=x+BLOCK_SIZE){ 
                                
                let point = {'x': x, 'y': y};
                let color_values = [];

                let total_distance = 0;
                let distances = [];                
                for (let edge_color of edge_colors){                    
                    let distance = this._distance(point, edge_color);
                    distance = (distance == 0) ? 1 : 1/distance;
                    distances.push(distance);
                    total_distance += distance;
                }
                
                let total_distance_updated = 0;
                for (let idx=0;idx<distances.length;idx++){
                    let percentage = distances[idx] / total_distance;
                    if (percentage < SMOOTH_MIN){
                        distances[idx] = 0;
                    } else {
                        total_distance_updated += distances[idx]
                    }
                }
                
                for (let color of color_keys){
                    let idx=0;
                    let value = 0;
                    for (let edge_color of edge_colors){
                        value = value + (edge_color.color[color] * (distances[idx] / total_distance_updated));
                        idx++;                        
                    }   
                    color_values.push(value);                    
                }

                let hsla = `hsla( ${color_values[0]} , ${color_values[1]*100}% , ${color_values[2]*100}% , ${color_values[3]} )`;
                let width  = BLOCK_SIZE;
                let height = BLOCK_SIZE;
                if (x+width>point_bottom_right.x){                    
                    width = point_bottom_right.x - x;
                }

                if (y+height>point_bottom_right.y){                    
                    height = point_bottom_right.y - y;
                }

                this.svg.rectangle(x, y, width, height, hsla, 'transparent', 0, false);        
                
            }            
        }                    
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    _create_position(x,y){
        return {
            'x': this._undefined_to_number(this.axis_x?.get_position_from_value(x)),
            'y': this._undefined_to_number(this.axis_y?.get_position_from_value(y)),          
        };
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    _create_position_color(x,y){
        let pos_x = this._undefined_to_number(this.axis_x?.get_position_from_value(x));
        let pos_y = this._undefined_to_number(this.axis_y?.get_position_from_value(y));
        let color = this._get_color(x,y);
        return {'x': pos_x, 'y': pos_y, 'color' : color };
    }
   
    _plot(){ 
        let edges = [];
        for (let y=0;y<this.range.y.max;y=y+1){
            for (let x=0;x<this.range.x.max;x++){
                let pos = this._create_position_color(x,y);
                edges.push(pos);
            }
        }       

        for (let y=this.range.y.min;y<this.range.y.max;y++){
            for (let x=this.range.x.min;x<this.range.x.max;x++){
                let pos_bottom_right = this._create_position(x+1, y);
                let pos_top_left = this._create_position(x, y+1);


                this._fill_box(pos_top_left, pos_bottom_right, edges);                      
            }
            
        }
        
    }

    _draw(){
        this.axis_x = new DynoAxis(this.svg, "x_axis", 'linear', -1, this.range.x, this.config.graph_margin );
        this.axis_y = new DynoAxis(this.svg, "y_left", 'linear', -1, this.range.y, this.config.graph_margin );

        this._plot();
    }
}