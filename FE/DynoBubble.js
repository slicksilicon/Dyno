import { DynoAxis } from "./DynoAxis.js";
import { DynoSvg } from "./DynoSvg.js";
import { DynoConfig } from "./DynoConfig.js";
import { get_colors, getAttributeStr, removeElement } from "./DynoTools.js";

const LABEL_WIDTH = 250;
const LABEL_HEIGHT = 32;
const LABEL_MARGIN = 5;

const RADIUS_MIN = 10
const RADIUS_MAX_PERCENTAGE = 0.03

const IDX_X = 0
const IDX_Y = 1
const IDX_R = 2
const IDX_C = 3
const IDX_COUNT = 4

const POINT_NAME_ATTRIB = 'point_name';
const GROUP_NAME_ATTRIB = 'group_name';

export class DynoBubble{
    /**
     * @param {string |HTMLDivElement} div
     * @param {{[x:string]: {[y:string] : number[]}}} data
     * @param {DynoConfig} config
     */
    constructor(div, data, config){
        this.svg = new DynoSvg(div);
        this.config = config;
        this.data = data;

        /** Internal Variables **/
        this.labels = [];

        /** Callback Settings **/
        this.callback_click = null;
        this.callback_hover = null;

        /** Parse Data **/
        this.groups = Object.keys(data);
        this.range_values = this._range_values(); 
        this.colors = this._colors();               
        
        /** Create Axis **/
        this.range_radius = this._range_radius();
        this.axis_x = this._draw_axis(IDX_X);
        this.axis_y = this._draw_axis(IDX_Y);
        this._draw();
   
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

    _colors(){
        let colors = {};
        for (const group of this.groups){
            let count = this.range_values[IDX_C].max - this.range_values[IDX_C].min;
            colors[group] = get_colors(this.config.color_schemes, group, this.config.color_alpha, count);
        }

        return colors;
    }
    
    /**
     * 
     * @returns {{max: number, min: number}[]}}
     */

    _range_values(){
        /**@type number[][] */
        let values = [[], [], [], []];     
        let ranges = [];

        for (const group of this.groups){
            for (const point_name in this.data[group]){
                for (let idx=0;idx<IDX_COUNT;idx++){
                    values[idx].push(this.data[group][point_name][idx]);
                }
            }
        }
        
        /* Calculate Range for X & Y Axis which can be configured by user */
        ranges = ranges.concat(this.config.calc_data_range(values[IDX_X], values[IDX_Y]));

        for (let idx=IDX_R;idx<IDX_COUNT;idx++){            
            let my_min = Math.min(...values[idx]);
            let my_max = Math.max(...values[idx]);
            ranges.push({'max': my_max, 'min': my_min});
        }

        return ranges;
    }

    _range_radius(){
        let height = this.svg.get_height()
        let width  = this.svg.get_width();
        
        let radius_max = Math.max(height, width) * RADIUS_MAX_PERCENTAGE;
        
        return {'min': RADIUS_MIN, 'max': radius_max};
    }

    /**
     * @param {number} value
    */
    _get_radius(value){
        let percentage = (value - this.range_values[IDX_R].min) / (this.range_values[IDX_R].max - this.range_values[IDX_R].min);
        let radius = (percentage * (this.range_radius.max - this.range_radius.min)) + this.range_radius.min;        

        if(radius > this.range_radius.max){
            console.error(`Radius is out of range for ${value} ==> ${radius} vs max = ${this.range_radius.max}`)
            radius = this.range_radius.max;
        }

        return radius;
    }

    /**
     * @param {number} value
     * @param {string} group
     */
    _get_color(value, group){
        let percentage = (value - this.range_values[IDX_C].min) / (this.range_values[IDX_C].max - this.range_values[IDX_C].min);
        let offset = percentage * (this.colors[group].length-1);
        offset = Math.round(offset);

        if (offset >= this.colors[group].length){
            console.error(`Invalid Color Offset = ${offset} when max colors = ${this.colors[group].length} for value=${value}, category=${group}`);
            offset = this.colors[group].length - 1;
        }

        return this.colors[group][offset];
    }    

    /**
     * @param {number} idx
     */
    _draw_axis(idx){        
        /**@type {'x_axis'| 'y_left' | 'y_right'} */
        let location = (idx == IDX_X) ? 'x_axis' : 'y_left';
        return new DynoAxis(this.svg, location, 'linear', -1, this.range_values[idx], this.config.graph_margin);        
    }

    _resize(){        
        this.range_radius = this._range_radius();
        this.axis_x = this._draw_axis(IDX_X);
        this.axis_y = this._draw_axis(IDX_Y);
        this._draw();
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
        if (label_y < this.axis_y.get_axis_end()- LABEL_MARGIN){
            label_y = cy + radius + LABEL_MARGIN + (LABEL_HEIGHT/2);
        }

        /* Center, Right Or Left */
        label_x = cx - (LABEL_WIDTH/2);
        if ((label_x - (LABEL_WIDTH/2) - LABEL_MARGIN)< this.axis_x.get_axis_start() ){
            label_x = cx + radius + LABEL_MARGIN;
            label_y = cy;
        }

        if ((label_x + (LABEL_WIDTH/2) + LABEL_MARGIN) > this.axis_x.get_axis_end()){
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
        let color  = this._get_color(point[IDX_C], group);
        let cx = this.axis_x.get_position_from_value(point[IDX_X]);
        let cy = this.axis_y.get_position_from_value(point[IDX_Y]);

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
                this._draw_bubble(group, point_name)
            }
        }        
    }
}