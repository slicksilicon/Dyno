import { DynoSvg } from "./DynoSvg.js";
import { DynoConfig } from "./DynoConfig.js";
import { get_colors, convert_hsla_text_to_array} from "./DynoTools.js";
import { DynoAxis } from "./DynoAxis.js";
import { GetCtrl } from "../../FasterOrsted/FE/fetch.js";


const COLOR_COUNT = 10;
const BLOCK_SIZE = 5;
const SMOOTH_MIN = 0.00001;

export class DynoHeatmapGaussian{
    /**
     * @param {string|HTMLDivElement} id
     * @param {DynoConfig} config
     * @param {number[][]} data
     */
    constructor(id, data, config){
        this.svg = new DynoSvg(id);
        this.config = config;
        this.raw_data = data;
        this.resized_data = data;

        this.color = [];
        let color_text = get_colors(this.config.color_schemes, 'heatmap', 0.5, COLOR_COUNT).reverse();
        for (let idx=0;idx<color_text.length;idx++){
            this.color.push(color_text[idx]);
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


    async _draw(){
        let range_x = {'min': 0, 'max': this.raw_data[0].length-1};
        let range_y = {'min': 0, 'max': this.raw_data.length-1}
        this.axis_x = new DynoAxis(this.svg, "x_axis", 'linear', -1, range_x, this.config.graph_margin );
        this.axis_y = new DynoAxis(this.svg, "y_left", 'linear', -1, range_y, this.config.graph_margin );

        let size_x = Math.round(this.axis_x.get_length()/BLOCK_SIZE);
        let size_y = Math.round(this.axis_y.get_length()/BLOCK_SIZE);
        
        this.resized_data = await GetCtrl('get_dyno_array_resize', {'data': this.raw_data, 'size_x': size_x, 'size_y': size_y, 'max_value': COLOR_COUNT-1}, true);

        let x_start = this.axis_x.get_axis_start();
        let y_end = this.axis_y.get_axis_end()
        let x_length = this.axis_x.get_length();
        let y_length = this.axis_y.get_length();

        let idx_y = 0;        
        for (let y=0;y<y_length;y=y+BLOCK_SIZE){         
            let idx_x = 0;
            for (let x=0;x<x_length;x=x+BLOCK_SIZE){
                let value = this.resized_data[idx_y][idx_x];
                if (typeof value === 'undefined'){
                    console.error(`Undefined value for x=${idx_x} y=${idx_y} pos_y = ${y} pos_x = ${x} size_y = ${this.resized_data.length}`);
                    continue;
                }

                let color = this.color[value];     
                if (typeof color === 'undefined'){
                    console.log(`value = ${value}`);
                    continue;                    
                }                                                           
                this.svg.rectangle(x+x_start, y_end-y-BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, color, 'transparent', 0, false); 

                idx_x++;
                if (idx_x == this.resized_data[idx_y].length){
                    console.log(`Breaking idx_x = ${idx_x} @ idx_y = ${idx_y}`);
                    break;
                }
            }
            idx_y++;
            if (idx_y == this.resized_data.length){
                console.log(`Breaking idx_y = ${idx_y}`)
                break;
            }
        }
    }
}