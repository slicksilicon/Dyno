import { DynoSvg } from "./DynoSvg.js";
import { DynoConfig } from "./DynoConfig.js";
// import { get_colors, convert_hsla_text_to_array} from "./DynoTools.js";
import { DynoColors, convert_hsla_text_to_array } from "./DynoColors.js";
import { DynoAxis } from "./DynoAxis.js";
import { GetCtrl } from "../../FasterOrsted/FE/fetch.js";


const COLOR_COUNT = 10;
const BLOCK_SIZE = 5;
const SMOOTH_MIN = 0.00001;

const DEFAULT_COLOR_SCHEME = 'heatmap';
const DEFAULT_ALPHA = 0.5;

export class DynoHeatmapGaussian{
    /**
     * @param {string|HTMLDivElement} id
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number}} graph_margins     
     */
    constructor(id, graph_margins){
        /************/
        /** Parent **/
        /************/
        this.svg = new DynoSvg(id);   

        /**@type Element[] */
        this.rectangles = []
        
        /**********/
        /** Axis **/
        /**********/
        this.axis = {
            'x_axis': new DynoAxis(this.svg, 'x_axis', graph_margins),
            'y_axis': new DynoAxis(this.svg, 'y_left', graph_margins)
        };
        
        /**********/
        /** Axis **/
        /**********/

        /**@type number[][] */
        this.data = [[]];
        /**@type number[][] */
        this.resized_data = [[]];

        /************/
        /** Colors **/
        /************/

        /**@type DynoColors */
        this.dyno_color = new DynoColors();
        this.dyno_color.set_scheme_alpha(DEFAULT_COLOR_SCHEME, DEFAULT_ALPHA);
        this.dyno_color.set_count(COLOR_COUNT);
              
        this.svg.add_resize_callback(this._resize.bind(this), true);
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
            'x': this._undefined_to_number(this.axis.x_axis.get_position_from_value(x)),
            'y': this._undefined_to_number(this.axis.y_axis.get_position_from_value(y)),          
        };
    }

    _set_ranges(){
        let values = [];
        let size_x = this.data[0].length;
        for (let inner_array of this.data){
            for (let value of inner_array){
                values.push(value);
            }

            if (inner_array.length != size_x){
                console.error(`Data length is inconsistant ${size_x} but got ${inner_array.length}`);
                size_x = Math.max(size_x, inner_array.length);
            }
        }

        /** Set Data Range **/
        this.dyno_color.set_data_range_actual(Math.min(...values), Math.max(...values));

        /** Set X-Axis & Y-Axis */
        this.axis.x_axis.set_linear_data([], 'number', null, 0, size_x, null);
        this.axis.y_axis.set_linear_data([], 'number', null, 0, this.data.length, null);
    }

    /**
     * @param {number[][]} data
    */
    async draw(data){
        this.data = data;
        this._set_ranges();
        await this._plot();
    }
    
    async _resize(){
        this.axis.x_axis.remove();
        this.axis.y_axis.remove();

        while (this.rectangles.length > 0){
            let rectangle = this.rectangles.pop();
            rectangle?.remove();
        }

        await this._plot();
    }


    async _plot(){
        // let range_x = {'min': 0, 'max': this.raw_data[0].length-1};
        // let range_y = {'min': 0, 'max': this.raw_data.length-1}
        // this.axis_x = new DynoAxis(this.svg, "x_axis", 'linear', -1, range_x, this.config.graph_margin );
        // this.axis_y = new DynoAxis(this.svg, "y_left", 'linear', -1, range_y, this.config.graph_margin );

        let size_x = Math.round(this.axis.x_axis.get_length()/BLOCK_SIZE);
        let size_y = Math.round(this.axis.y_axis.get_length()/BLOCK_SIZE);
        
        this.resized_data = await GetCtrl('get_dyno_array_resize', {'data': this.data, 'size_x': size_x, 'size_y': size_y, 'max_value': COLOR_COUNT-1}, true);

        let x_start = this.axis.x_axis.get_axis_start();
        let y_end = this.axis.y_axis.get_axis_end()
        let x_length = this.axis.x_axis.get_length();
        let y_length = this.axis.y_axis.get_length();

        let idx_y = 0;        
        for (let y=0;y<y_length;y=y+BLOCK_SIZE){         
            let idx_x = 0;
            for (let x=0;x<x_length;x=x+BLOCK_SIZE){
                let value = this.resized_data[idx_y][idx_x];
                if (typeof value === 'undefined'){
                    console.error(`Undefined value for x=${idx_x} y=${idx_y} pos_y = ${y} pos_x = ${x} size_y = ${this.resized_data.length}`);
                    continue;
                }

                let color = this.dyno_color.get_color_for_value(value);                                                          
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