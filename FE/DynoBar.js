import { DynoSvg, MY_FILL } from "./DynoSvg.js";
import { DynoAxis } from "./DynoAxis.js";
import { DynoConfig } from "./DynoConfig.js";
import { get_colors, get_text_color } from "./DynoTools.js";
import { DynoText, getAttributeStr, removeElement} from "./DynoTools.js";

/**@type {{'left': number, 'right': number, 'top': number, 'bottom': number, line_spacing:number}} */
const LABEL_MARGINS = {'left': 3, 'right': 3, 'top': 3, 'bottom': 3, 'line_spacing': -3};

/**@type {{'height': number, 'width': number}} */
const LABEL_MAX_SIZE = {'height': 40, 'width': 10000};


    export class DynoBar{        
        /**
         * @param {string|HTMLDivElement} id
         * @param {{[x:string] : { [y:string] : {[z:string]: number}}}} data
         * @param {DynoConfig} config
         */
        constructor(id, data, config){
            this.svg = new DynoSvg(id);
            this.config = config;
            this.data = data;

            /* Internal Variables */
            this.dyno_text = new DynoText(this.config.label_type);            
            this.bars = [];            

            /** Parse Data **/
            this.groups = Object.keys(this.data);
            this.stacks = this._extract_stacks();
            this.active_stacks = this.stacks.slice();
            this.items = this._extract_items();

            /* Create Colors */
            this.colors = this._create_stacked_bar_colors();

            /* Axis */
            this.range_value = this._calc_range_value();
            this.axis_main = this._create_axis_main();
            this.axis_sub  = this._create_axis_sub();

            /* Draw */
            this._draw();

            this.svg.add_resize_callback(this._resize.bind(this), true); 
        }    
    
    _extract_stacks(){
        let stacks = [];
       
        for (const group in this.data){
            let stack_names = Object.keys(this.data[group]);
            for (let stack_name of stack_names){
                if (!(stacks.includes(stack_name))){
                    stacks.push(stack_name)
                }
            }
        }
        
        return stacks;
    }

    _extract_items(){
        let items = [];

        for (let group in this.data){
            /* Iterate Stacks of a Group */
            for (let stack in this.data[group]){
                /* Iterate Categories of a Stack in a Group */
                for (let category in this.data[group][stack]){
                    if (!(items.includes(category))){
                        items.push(category);
                    }
                }
            }
        }

        return items;
    }

    /**     
    * @return {{[x: string]: {[x: string]: string}}}
    */
    _create_stacked_bar_colors(){    
        /**@type  {{[x: string]: {[x: string]: string}}}*/                   
        let color_map = {};

        let count = this.items.length;        
        for (let stack of this.stacks){
            let clrs = get_colors(this.config.color_schemes, stack, 1, count);
        
            /**@type {{[x:string]: string}} */            
            let color_items = {};
        
            let item_idx = 0;
            for (const item of this.items){
                color_items[item] = clrs[item_idx];
                item_idx++;
            }

            color_map[stack] = color_items;
        }
                
        return color_map;
    }

    /**     
    * @return {{min: number, max:number}}}
    */
    _calc_range_value(){
        let values = []
        for (const group in this.data){
            for (const stack in this.data[group]){
                let value = 0;
                for (const item in this.data[group][stack]){
                    value += this.data[group][stack][item]                    
                }
                values.push(value);
            }
        }

        let range = this.config.calc_data_range([0], values);

        return range[1];
    }

    _create_axis_main(){
        /**@type {'x_axis'|'y_left'} */
        let axis_location = (this.config.bar_orientation == 'potrait') ? 'x_axis' : 'y_left';

        /**@type {'linear'|'discreet'} */
        let axis_mode = (this.config.graph_type == 'bar') ? 'discreet' : "linear";

        let axis = new DynoAxis(this.svg, axis_location, axis_mode, -1, this.groups, this.config.graph_margin)

        return axis;
    }

    _create_axis_sub(){        
        /**@type {'x_axis'|'y_left'} */
        let axis_location = (this.config.bar_orientation == 'potrait') ? 'y_left' : 'x_axis';

        /**@type {'linear'|'discreet'} */
        let axis_mode = "linear"      

        let axis = new DynoAxis(this.svg, axis_location, axis_mode, -1, this.range_value, this.config.graph_margin);

        return axis;

    }

    /**************/
    /* Draw Graph */
    /**************/

    /**
     * @param {Element} bar
     * @param {string} item
     * @param {string|number} value
     * @return {Element[]}
     */
    _draw_label(bar, item, value){
        let display_value = this.dyno_text.display_value_string(value);
        let elements = this.svg.text_in_element([item, display_value], bar, LABEL_MAX_SIZE, LABEL_MARGINS, 'center', 'center', null);
        return elements;
    }
    
    /**
         * @param {number} group_idx
         * @param {number} stack_idx
         * @param {number} start_value
         * @param {number} value
         * @param {string} color
         * @param {number} bar_width
         * @param {string} item         
         */
    _draw_rect(group_idx, stack_idx, start_value, value, color, bar_width, item){
        let sub_axis_length = this.axis_sub.get_length();
        let group_width = this.axis_main.get_step_width();
        let segment_start = this.axis_main.get_tick_position(group_idx) - group_width/2;

        let bar_base_start = segment_start + (stack_idx * bar_width) + this.config.bar_spacing;        

        let value_range = (this.range_value.max - this.range_value.min);        
        let bar_tall_start = (start_value  / value_range) * sub_axis_length
        let bar_tall   = (value / value_range) * sub_axis_length;

        bar_tall_start = this.axis_sub.get_axis_end() - bar_tall_start - bar_tall;        
        
        let bar = this.svg.rectangle(bar_base_start, bar_tall_start, bar_width, bar_tall, color, 'black', 2, false);
        this.svg.set_id(bar, item);
        this.svg.callback_hover(bar, this._callback_hover.bind(this));        
                        
        return bar;
    }

    _draw(){                
        let bar_width = (this.axis_main.get_step_width() - this.config.bar_spacing*2) / this.stacks.length;

        let group_idx = 0;
        for (const group of this.groups){     

            let stack_idx = 0;
            for (const stack of this.stacks){
            
                let start_value = 0;
                for (const item in this.data[group][stack]){
                    let value = this.data[group][stack][item];
                    let color = this.colors[stack][item];
                    let bar = this._draw_rect(group_idx, stack_idx, start_value, value, color, bar_width, item);
                    let labels = this._draw_label(bar, item, value);   
                    
                    this.bars.push({'bar': bar, 'labels': labels});

                    start_value += value;
                }
                stack_idx++;
            }

            group_idx++;
        }  
    }




    /*******************/
    /* Resize Callback */
    /*******************/

    _resize(){     
        /* Clear Internal Reference, as actual objects are cleared by svg library */
        this.bars.length = 0;
        

        /* Axis */        
        this.axis_main = this._create_axis_main();
        this.axis_sub  = this._create_axis_sub();

        /* Draw */
        this._draw();
    }


    /**
         * @param {{bar: Element, labels: Element[]}} bar         
         * @param {string} rect_color
         * @param {string} stroke_color
         * @param {string|null} text_color
         */
    _change_bar_color(bar, rect_color, stroke_color, text_color){                
        bar.bar.setAttribute('fill', rect_color);
        bar.bar.setAttribute('stroke', stroke_color);
        for (let label of bar.labels){
            text_color = (text_color == null) ? getAttributeStr(label, MY_FILL) : text_color;
            label.children[0].setAttribute('fill', text_color);
        }
    }


    /**
     * @param {string} item
     * @param {boolean} focus
     */
    focus_item(item, focus){        
        for (let bar of this.bars){
            if (bar.bar.id == item){
                if (focus == true){
                    this._change_bar_color(bar, 'black', 'grey', 'goldenrod');             
                } else {
                    let rect_color = getAttributeStr(bar.bar, MY_FILL);                    
                    this._change_bar_color(bar, rect_color, 'black', null);                    
                }
            }
        }
    }

    /**************************/
    /* Manage Hover Callbacks */
    /**************************/

    _callback_hover(){
        let event_type = arguments[0].type;
        if (event_type != 'mouseenter' && event_type != 'mouseleave'){
            return;
        }
        let id = arguments[0].currentTarget.id;
        if (typeof id === 'undefined'){
            console.error(`Invalid Id for callback = ${arguments[0]}`);
            return;
        }

        let enter = (event_type == 'mouseenter') ? true : false;
        this.focus_item(id, enter);
    }
}