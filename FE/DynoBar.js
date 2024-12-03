import { DynoSvg, MY_FILL } from "./DynoSvg.js";
import { DynoAxis } from "./DynoAxis.js";
import { DynoColors, factory_multiple_schemes, check_scheme } from "./DynoColors.js";
import { DynoText } from "./DynoText.js";
import { getAttributeStr} from "./DynoTools.js";
import { SelectorCallback } from "../../FasterOrsted/FE/SelectorBaseCtrl.js";

/**@type {{'left': number, 'right': number, 'top': number, 'bottom': number, line_spacing:number}} */
const LABEL_MARGINS = {'left': 3, 'right': 3, 'top': 3, 'bottom': 3, 'line_spacing': -3};

/**@type {{'height': number, 'width': number}} */
const LABEL_MAX_SIZE = {'height': 40, 'width': 10000};

const DEFAULT_BAR_SPACING = 5;

const DEFAULT_LABEL_CURRENCY = 'ringgit';
const DEFAULT_LABEL_DATE = 'month_year';

const DEFAULT_ALPHA = 0.7;

    export class DynoBar{        
    /**
     * @param {string|HTMLDivElement} id         
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number}} graph_margins 
     */
    constructor(id, graph_margins){

        /********************/
        /** Parent Element **/
        /********************/

        /** @type DynoSvg */
        this.svg = new DynoSvg(id);
        
        /**@type {{'bar': Element, 'labels' : Element[]}[]} */
        this.elements = [];

        /******************/
        /** Data Related **/
        /******************/

        /**@type {{[x:string] : { [y:string] : {[z:string]: number}}}} */
        this.data = {};

        /**@type string[] */
        this.groups = [];

        /**@type string[] */
        this.stacks = [];

        /**@type string[] */
        this.active_stacks = [];

        /**@type string[] */
        this.items = [];

        /**************/
        /** Labeling **/
        /**************/

        /**@type DynoText */
        this.text_name = new DynoText('string', DEFAULT_LABEL_DATE, DEFAULT_LABEL_CURRENCY, null);

        /**@type DynoText */
        this.text_value = new DynoText('currency', DEFAULT_LABEL_DATE, DEFAULT_LABEL_CURRENCY, null);

        /************/
        /** Axises **/
        /************/

        /**@type {{'x_axis': DynoAxis, 'y_axis': DynoAxis}} */
        this.axis = {
            'x_axis': new DynoAxis(this.svg, 'x_axis', graph_margins),
            'y_axis': new DynoAxis(this.svg, 'y_left', graph_margins)
        }

        /************/
        /** Colors **/
        /************/

        /**@type {{[x: string]: DynoColors}|{}} */
        this.dyno_colors = {};
        
        /**@type number*/
        this.alpha = DEFAULT_ALPHA;

        /**@type {{[x:string]: string}} */
        this.user_schemes = {};

    
        /************/
        /** Layout **/
        /************/
        /**@type number */
        this.bar_spacing = DEFAULT_BAR_SPACING;

        this.svg.add_resize_callback(this._resize.bind(this), true); 
    }
    
    set_value_number(){
        this.text_value.set_mode('number');
    }

    set_value_percentage(){
        this.text_value.set_mode('percentage');
    }

    /**
    * @param {TYPE_LABEL_CURRENCY} currency_type
    */
    set_value_currency(currency_type){
        this.text_value.set_mode('currency');
        this.text_value.set_currency_type(currency_type);
    }

    /**
     * Sets the Y Axis Range
     * @param {number|null} min
     * @param {number|null} max
     */
    set_axis_range(min, max){
        this.axis.y_axis.set_range(min, max);
    }

    /**
     * @param {number} alpha
     */
    set_alpha(alpha){
        this.alpha = alpha;
    }

    /**
         * @param {string} stack_name
         * @param {string} scheme_name
         */
    set_scheme(stack_name, scheme_name){
        if (check_scheme(scheme_name) == false){
            return;
        }
        
        this.user_schemes[stack_name] = scheme_name;
    }

    /**
     * @param {number} spacing
     */
    set_bar_spacing(spacing){
        this.bar_spacing = spacing;
    }

    /**
     * @param {{[x:string] : { [y:string] : {[z:string]: number}}}} data
     */
    draw(data){
        this.data = data;

        /** Parse Data **/
        this.groups = Object.keys(this.data);
        this._extract_stacks();        
        this._extract_items();
        this._create_dyno_colors();
        this._draw_axis();

        /** Draw **/
        this._draw();
    }

    _extract_stacks(){
        this.stacks.length = 0;        
        this.active_stacks.length = 0;
       
        for (const group in this.data){
            let stack_names = Object.keys(this.data[group]);
            for (let stack_name of stack_names){
                if (!(this.stacks.includes(stack_name))){
                    this.stacks.push(stack_name);
                    this.active_stacks.push(stack_name);
                }
            }
        }                        
    }

    _extract_items(){
        this.items.length = 0;

        for (let group in this.data){
            /* Iterate Stacks of a Group */
            for (let stack in this.data[group]){
                /* Iterate Categories of a Stack in a Group */
                for (let category in this.data[group][stack]){
                    if (!(this.items.includes(category))){
                        this.items.push(category);
                    }
                }
            }
        }        
    }

    // /**     
    // * @return {{[x: string]: {[x: string]: string}}}
    // */
    // _create_stacked_bar_colors(){    
    //     /**@type  {{[x: string]: {[x: string]: string}}}*/                   
    //     let color_map = {};

    //     let count = this.items.length;        
    //     for (let stack of this.stacks){
    //         let clrs = get_colors(this.config.color_schemes, stack, 1, count);
        
    //         /**@type {{[x:string]: string}} */            
    //         let color_items = {};
        
    //         let item_idx = 0;
    //         for (const item of this.items){
    //             color_items[item] = clrs[item_idx];
    //             item_idx++;
    //         }

    //         color_map[stack] = color_items;
    //     }
                
    //     return color_map;
    // }

    _create_dyno_colors(){        
        let stack_size = {};
        for (let stack of this.stacks){
            stack_size[stack] = this.items.length;
        }

        this.dyno_colors = factory_multiple_schemes(this.user_schemes, stack_size, this.alpha);
    }

    // /**     
    // * @return {{min: number, max:number}}}
    // */
    // _calc_range_value(){
    //     let values = []
    //     for (const group in this.data){
    //         for (const stack in this.data[group]){
    //             let value = 0;
    //             for (const item in this.data[group][stack]){
    //                 value += this.data[group][stack][item]                    
    //             }
    //             values.push(value);
    //         }
    //     }

    //     let range = this.config.calc_data_range([0], values);

    //     return range[1];
    // }

    /**
     * Accumulates all y values
     * @returns number[]
     */
    _collate_y_data(){
        let values = [];
        for (const group in this.data){
            for (const stack in this.data[group]){
                let stack_total = 0;
                for (const item in this.data[group][stack]){
                    stack_total = stack_total + this.data[group][stack][item];
                }
                values.push(stack_total);
            }
        }

        return values;
    }

    _draw_axis(){
        this.axis.x_axis.set_discreet_data(Object.keys(this.data));
        let linear_data = this._collate_y_data()
        this.axis.y_axis.set_linear_data(linear_data, 'number', null, null, null, null);
    }

    // _create_axis_main(){
    //     /**@type {'x_axis'|'y_left'} */
    //     let axis_location = (this.config.bar_orientation == 'potrait') ? 'x_axis' : 'y_left';

    //     /**@type {'linear'|'discreet'} */
    //     let axis_mode = (this.config.graph_type == 'bar') ? 'discreet' : "linear";

    //     let axis = new DynoAxis(this.svg, axis_location, axis_mode, -1, this.groups, this.config.graph_margin)

    //     return axis;
    // }

    // _create_axis_sub(){        
    //     /**@type {'x_axis'|'y_left'} */
    //     let axis_location = (this.config.bar_orientation == 'potrait') ? 'y_left' : 'x_axis';

    //     /**@type {'linear'|'discreet'} */
    //     let axis_mode = "linear"      

    //     let axis = new DynoAxis(this.svg, axis_location, axis_mode, -1, this.range_value, this.config.graph_margin);

    //     return axis;

    // }

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
        let display_value = this.text_value.display_value_string(value);
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
        let sub_axis_length = this.axis.y_axis.get_length();
        let group_width = this.axis.x_axis.get_step_width();
        let segment_start = this.axis.x_axis.get_tick_position(group_idx) - group_width/2;

        /** Y Axis Range **/
        let range_max = this.axis.y_axis.get_max_value();
        let range_min = this.axis.y_axis.get_min_value();
        let value_range = (range_max - range_min);        

        let bar_base_start = segment_start + (stack_idx * bar_width) + this.bar_spacing;        
        
        let bar_tall_start = (start_value  / value_range) * sub_axis_length
        let bar_tall   = (value / value_range) * sub_axis_length;

        bar_tall_start = this.axis.y_axis.get_axis_end() - bar_tall_start - bar_tall;        
        
        let bar = this.svg.rectangle(bar_base_start, bar_tall_start, bar_width, bar_tall, color, 'black', 2, false);
        this.svg.set_id(bar, item);
        this.svg.callback_hover(bar, this._callback_hover.bind(this));        
                        
        return bar;
    }

    _draw(){                
        let bar_width = (this.axis.x_axis.get_step_width() - this.bar_spacing*2) / this.stacks.length;

        let group_idx = 0;
        for (const group of this.groups){     

            let stack_idx = 0;
            for (const stack of this.stacks){
            
                let start_value = 0;
                let item_offset = 0;
                for (const item in this.data[group][stack]){
                    let value = this.data[group][stack][item];
                    let color = this.dyno_colors[stack].get_color(item_offset);
                    
                    let bar = this._draw_rect(group_idx, stack_idx, start_value, value, color, bar_width, item);
                    let labels = this._draw_label(bar, item, value);   
                    
                    let bar_element = {'bar': bar, 'labels' :labels};
                    this.elements.push(bar_element)                    

                    start_value += value;
                    item_offset += 1;
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
        this.elements.length = 0;        

        this.axis.x_axis.remove();
        this.axis.y_axis.remove();

        this._draw_axis();

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
        for (let element_group of this.elements){
            if (element_group.bar.id == item){
                if (focus == true){
                    this._change_bar_color(element_group, 'black', 'grey', 'goldenrod');             
                } else {
                    let rect_color = getAttributeStr(element_group.bar, MY_FILL);                    
                    this._change_bar_color(element_group, rect_color, 'black', null);                    
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