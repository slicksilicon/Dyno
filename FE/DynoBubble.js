import { DynoAxis } from "./DynoAxis.js";
import { DynoSvg } from "./DynoSvg.js";
import { DynoColors } from "./DynoColors.js";
import { getAttributeStr, removeElement } from "./DynoTools.js";

const LABEL_WIDTH = 250;
const LABEL_HEIGHT = 32;
const LABEL_MARGIN = 5;

const RADIUS_MIN = 10;
const RADIUS_MAX_PERCENTAGE = 0.03;

const IDX_X = 0
const IDX_Y = 1
const IDX_R = 2
const IDX_C = 3
const IDX_COUNT = 4

const POINT_NAME_ATTRIB = 'point_name';
const GROUP_NAME_ATTRIB = 'group_name';

const DEFAULT_ALPHA = 0.8;
const DEFAULT_COLOR_SCHEME = 'teal';

/**@typedef {{'min': null|number, 'max': null|number}} TypeRangeNull */
/**@typedef {{'min': number, 'max': number}} TypeRange */

class DynoRadius{
    /**
     * @param {DynoSvg} svg
     */
    constructor(svg){
        /**@type {DynoSvg} */
        this.svg = svg;

        /**@type TypeRangeNull */
        this.data_user   = {'min': null, 'max': null};
        
        /**@type TypeRange */
        this.data_actual = {'min': 0, 'max': 0};

        /**@type TypeRange */
        this.data_use = {'min': 0, 'max': 0};

        /**@type TypeRange */
        this.radius = {'min': RADIUS_MIN, 'max': RADIUS_MIN};
        this._calc_radius();
    }

    resized(){                
        this._calc_radius();        
    }

    reset_data(){
        this.data_actual = {'min': 0, 'max': 0};
        this.data_use = {'min': 0, 'max': 0};
        this._calc_data_use();
    }

    /**
     * @param {number} min
     * @param {number} max
     */
    set_data_range(min, max){
        if (min >= max){
            console.error(`Min [${min}] >= Max [${max}]`);
            return;
        }

        this.data_user.max = max;
        this.data_user.min = min;

        this._calc_data_use();
    }

    /**
     * @param {number[]} data
     */
    set_data_range_actual(data){
        this.data_actual.max = Math.max(...data);
        this.data_actual.min = Math.min(...data);                

        this._calc_data_use();
    }

    /**
     * @param {number} value
     * @return {number}
     */
    get_radius(value){
        if (value <= this.data_use.min){
            return this.radius.min;
        }

        if (value >= this.data_use.max){
            return this.radius.max;
        }

        let percentage = (value - this.data_use.min) / (this.data_use.max - this.data_use.min);
        let radius = (percentage * (this.radius.max - this.radius.min)) + this.radius.min;

        return radius;        
    }

    _calc_radius(){
        let height = this.svg.get_height()
        let width  = this.svg.get_width();
                        
        this.radius.max =  Math.max(height, width) * RADIUS_MAX_PERCENTAGE;
        this.radius.min = RADIUS_MIN;        
    }

    _calc_data_use(){
        let max = (this.data_user.max == null) ? this.data_actual.max : this.data_user.max;
        let min = (this.data_user.min == null) ? this.data_actual.min : this.data_user.min;

        if (max < this.data_actual.max){
            console.warn(`Max Data Set By User [${max}] is smaller than actual data [${this.data_actual.max}]. Will be clipped`);
        }

        if (min > this.data_actual.min){
            console.warn(`Min Data Set By User [${min}] is smaller than actual data [${this.data_actual.min}]. Will be clipped`);
        }

        this.data_use.max = max;
        this.data_use.min = min;
    }
}

export class DynoBubble{
    /**
     * @param {string |HTMLDivElement} div     
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number}} graph_margins
     */
    constructor(div, graph_margins){
        this.svg = new DynoSvg(div);
        this.graph_margins = graph_margins;
        
        /*****************/
        /**Data Related **/
        /*****************/

        /**@type {{[x:string]: {[y:string] : number[]}}} */
        this.data = {};
        this.groups = [];
        
        /************************/
        /** Internal Variables **/
        /************************/
        this.labels = [];
        
        /***********************/
        /** Callback Settings **/
        /***********************/  
        
        /**@type {null|CallableFunction} */        
        this.callback_click = null;

        /**@type {null|CallableFunction} */
        this.callback_hover = null;
                        
        /********************/
        /** Color Settings **/
        /********************/

        /**@type {{[x:string]: DynoColors}} */
        this.dyno_colors = {};
        
        /**@type {{[x:string]: string}} */
        this.color_config = {};            

        /**@type {number} */
        this.alpha = DEFAULT_ALPHA;

        /*********************/
        /** Radius Settings **/        
        /*********************/
        this.radius = new DynoRadius(this.svg);

        /*******************/
        /** Axis Settings **/        
        /*******************/

        /**@type {{'x_axis': DynoAxis, 'y_axis': DynoAxis}} */
        this.axis = {   
            'x_axis' : new DynoAxis(this.svg, 'x_axis', this.graph_margins), 
            'y_axis' : new DynoAxis(this.svg, 'y_left', this.graph_margins)  
        };
   
        this.svg.add_resize_callback(this._resize.bind(this), true);
    }

    /**
     * @param {CallableFunction} callback
     */
    set_callback_click(callback){
        this.callback_click = callback;
    }

    /**
     * @param {CallableFunction} callback
     */
    set_callback_hover(callback){
        this.callback_hover = callback;
    }

    /**
     * @param {number} alpha
     */
    set_alpha(alpha){
        this.alpha = alpha;
    }

    /**
     * @param {AXIS} axis
     * @param {number} min
     * @param {number} max
     */
    set_axis_range(axis, min, max){
        this.axis[axis].set_range(min, max);
    }

    /**
     * @param {number} min
     * @param {number} max
     */
    set_radius_range(min, max){
        this.radius.set_data_range(min, max);
    }

    /**
     * @param {string} group_name
     * @param {number} min
     * @param {number} max
     */
    set_color_range(group_name, min, max){
        this.dyno_colors[group_name].set_data_range_user(min, max);
    }

    /**
     * @param {{ [x: string]: { [y: string]: number[]; }; }} data
     * @param {{ [x: string]: string}} color_schemes
     */
    draw(data, color_schemes){
        this.data = data;
        this.groups = Object.keys(data);
        
        /** Setup Dyno Colors **/
        this._setup_dyno_colors(color_schemes);
        this._calc_data_range_color();

        /** Calculate Radius Range*/
        this._calc_data_range_radius();        

        /** Create Axis **/
        this._create_axises();

        /** draw **/
        this._draw();
    }

    /**
     * @param {{[x:string]: string}} color_schemes
     */
    _setup_dyno_colors(color_schemes){
        let schemes = new DynoColors().get_schemes();
        let scheme_idx = 0;
        let provided_schemes = Object.keys(color_schemes);

        this.dyno_colors = {};

        for (let group of this.groups){
            let count = this._parse_number_of_shades(this.data[group]);            
            this.dyno_colors[group] = new DynoColors();

            if (provided_schemes.includes(group)){
                this.dyno_colors[group].setup_colors(color_schemes[group], count, this.alpha);
                continue;                
            }

            if (scheme_idx == schemes.length){
                this.dyno_colors[group].setup_colors(DEFAULT_COLOR_SCHEME, count, this.alpha);
                continue;
            }

            while (provided_schemes.includes(schemes[scheme_idx]) == true){
                scheme_idx = scheme_idx + 1;
                if (scheme_idx >= schemes.length){
                    this.dyno_colors[group].setup_colors(DEFAULT_COLOR_SCHEME, count, this.alpha);
                    continue;
                }
            }

            this.dyno_colors[group].setup_colors(schemes[scheme_idx], count, this.alpha);
            scheme_idx = scheme_idx + 1;
        }
    }

    /**
     * @param {{ [y: string]: number[]; }} group_data
     * @param {number} idx
     * @returns {number[]}
     */
    _get_data_bubble_data(group_data, idx){
        let values = [];
        for (let bubble_name of Object.keys(group_data)){
            let bubble_data = group_data[bubble_name];            
            values.push(bubble_data[idx])
        }

        return values
    }

    /**
     * @param {{ [y: string]: number[]; }} group_data
     * @returns {number}
     */
    _parse_number_of_shades(group_data){
        let shade_array = this._get_data_bubble_data(group_data, IDX_C);
        let shade_set = new Set(shade_array);

        return shade_set.size;
    }

    /**
     * @param {number} idx
     * @return {number[]}
     */
    _get_axis_data(idx){        
        let values = [];
        for (let group_name of this.groups){
            values = values.concat(this._get_data_bubble_data(this.data[group_name], idx));            
        }

        return values;
    }

    /**
     * @param {AXIS} axis
     */
    _create_axis_single(axis){
        let data = (axis == 'x_axis') ? this._get_axis_data(IDX_X) : this._get_axis_data(IDX_Y);
        this.axis[axis].set_linear_data(data, 'number', null, null, null, null);
    }

    _create_axises(){
        this._create_axis_single("x_axis");
        this._create_axis_single("y_axis");
    }

    _calc_data_range_radius(){
        let data = this._get_axis_data(IDX_R);
        this.radius.set_data_range_actual(data);
    }

    _calc_data_range_color(){
        for (let group_name of this.groups){
            let data = this._get_data_bubble_data(this.data[group_name], IDX_C);
            let min = Math.min(...data);
            let max = Math.max(...data);
            if (max == min){
                max = min + 1;
            }

            this.dyno_colors[group_name].set_data_range_actual(min, max);
        }
    }

    /**
     * @param {number} value
    */
    _get_radius(value){
        return this.radius.get_radius(value);
    }

    /**
     * @param {string} group_name
     * @param {number} value
     */
    _get_color(group_name, value){
        return this.dyno_colors[group_name].get_color_for_value(value);
    }
    
    _callback_hover(){
        let event = arguments[0].type;
        if (event != 'mouseenter' && event != 'mouseleave'){
            return;
        }

        let circle = arguments[0].currentTarget;

        /* Mouse Leaving Handler */
        if (event == 'mouseleave'){
            let color = getAttributeStr(circle, 'my_fill');
            circle.setAttribute('fill', color);
            removeElement(this.labels);

            if (this.callback_hover != null){
                this.callback_hover(null);
            }

            return;
        }

        /* Mouse Enter */
        circle.setAttribute('fill', 'black');
        
        let group_name = getAttributeStr(circle, GROUP_NAME_ATTRIB);
        let point_name = getAttributeStr(circle, POINT_NAME_ATTRIB);
        let point = this.data[group_name][point_name];
        
        let label_pos = this._label_position(circle);
        // let label_text = `[${group_name}:${point_name}] ${point}`;        
        let label = this.svg.text(point_name, label_pos[0], label_pos[1], 24, LABEL_WIDTH, LABEL_HEIGHT, 'black', 'center', 'center');
        this.labels.push(label); 
        
        if (this.callback_hover != null){
            this.callback_hover(point_name);
        }
    }

    /**
     * @param {{ currentTarget: any; }} args
     */
    _callback_click(args){
        if (this.callback_click == null){
            return;
        }

        let circle = args.currentTarget;
        let employee_name = getAttributeStr(circle, POINT_NAME_ATTRIB)
        
        this.callback_click(employee_name);
    }


    /**
     * @param {Element} circle
     */
    _label_position(circle){  
        let label_x = 0;
        let label_y = 0;

        let cx_string = circle.getAttribute('cx');
        let cy_string = circle.getAttribute('cy');
        let radius_string = circle.getAttribute('r');
        if (cx_string == null || cy_string == null || radius_string == null){
            console.error(`Invalid information from circle id = ${circle.id}`)
            return [label_x, label_y];
        }

        let cx = Number(cx_string);
        let cy = Number(cy_string);
        let radius = Number(radius_string);

        /* Top or Bottom */
        label_y = cy - radius - LABEL_MARGIN - (LABEL_HEIGHT/2);
        if (label_y < this.axis['y_axis'].get_axis_end()- LABEL_MARGIN){
            label_y = cy + radius + LABEL_MARGIN + (LABEL_HEIGHT/2);
        }

        /* Center, Right Or Left */
        label_x = cx - (LABEL_WIDTH/2);
        if ((label_x - (LABEL_WIDTH/2) - LABEL_MARGIN)< this.axis['x_axis'].get_axis_start() ){
            label_x = cx + radius + LABEL_MARGIN;
            label_y = cy;
        }

        if ((label_x + (LABEL_WIDTH/2) + LABEL_MARGIN) > this.axis['x_axis'].get_axis_end()){
            label_x = cx - LABEL_WIDTH - LABEL_MARGIN;
            label_y = cy;
        }

        return [label_x, label_y];
    }
    
    /**
     * @param {string} group
     * @param {string} point_name
     */
    _draw_bubble(group, point_name){
        let point = this.data[group][point_name];

        /* Calculate parameters */
        let radius = this._get_radius(point[IDX_R]);
        let color  = this._get_color(group, point[IDX_C]);
        let cx = this.axis['x_axis'].get_position_from_value(point[IDX_X]);
        let cy = this.axis['y_axis'].get_position_from_value(point[IDX_Y]);

        let circle_param = {'cx': cx, 'cy': cy, 'radius': radius};
        let circle = this.svg.circle(circle_param, color, 'black', 1, false);
        circle.setAttribute(POINT_NAME_ATTRIB, point_name);
        circle.setAttribute(GROUP_NAME_ATTRIB, group);
        this.svg.set_id(circle, `${group}-${point_name}`);
        

        this.svg.callback_hover(circle, this._callback_hover.bind(this));
        this.svg.callback_click(circle, this._callback_click.bind(this));
    }
        
    _draw(){
        for (const group of this.groups){
            for (const point_name in this.data[group]){
                this._draw_bubble(group, point_name);
            }
        }        
    }

    _resize(){
        this._draw();        
    }
}