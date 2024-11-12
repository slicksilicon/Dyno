import { DynoSvg } from "./DynoSvg.js";
import { GetType } from '../../FasterOrsted/FE/helpers.js';

/* Margin Defaults */
const MARGIN_LABEL_LEFT = 5;

/* Line Configuration Defaults */
const LINE_COLOR = 'black';
const LINE_WIDTH = 3;

/* Stroke Configuration Defaults */
const STROKE_LENGTH = 10;
const STROKE_WIDTH   = 3;
const STROKE_COLOR  = 'black';

/* Step Size Defaults */
const LINEAR_STEP_SIZE_DEFAULT = 75;

/* Label Size Defaults */
const MAX_LABEL_HEIGHT = 32;
const LABEL_FONT_SIZE = 24;

export class DynoAxis{
    
    /**
     * @param {DynoSvg} dyno_svg
     * @param {"x_axis"|"y_left"|"y_right"} axis_location
     * @param {'linear'|'discreet'} axis_mode  
     * @param {number} step_count set to -1 for auto     
     * @param {string[]|{'min': number, 'max': number}} label_config
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number}} graph_margins
     */

    constructor(dyno_svg, axis_location, axis_mode, step_count, label_config, graph_margins){
        this.dyno_svg = dyno_svg;
        this.axis_location = axis_location;
        this.axis_mode = axis_mode;  
        this.step_count = step_count;

        this.graph_margins = graph_margins;
        
        /* Setup Parent */
        this.parent_size = this._read_parent_size();        

        /* Setup Labels */
        /**@type {string[]} */
        this.labels_discreet = [];

        /**@type {{'min': number, 'max': number}} */
        this.labels_linear = {'min': 0, 'max': 0};
        
        if (this.axis_mode == 'discreet'){
            let config_type = GetType(label_config);
            if (config_type != 'array'){
                console.error(`Label Config Type Must be array and not ${config_type}`);                                
            }            
            //@ts-ignore
            this.labels_discreet = label_config;
        }

        if (this.axis_mode == 'linear'){
            //@ts-ignore
            if (typeof label_config.min === 'undefined' || typeof label_config.max === 'undefined'){
                console.error(`Invalid label_config doesn't have min or max ==> ${JSON.stringify(label_config)}`);
            }
            //@ts-ignore
            this.labels_linear = label_config;
        }

        /* Create Line */
        this.line = null;
        this.line_values = {'x1': 0, 'y1': 0, 'x2': 0, 'y2': 0};
        this._create_line();
        
        /* Create Steps */
        this.step_config = this._calculate_step_config();
        this.step_lines = [];
        this._create_steps();

        /* Create Labels */
        this.label_names = this._generate_label_names();
        this.label_text = [];
        this._create_labels();       

    }

    /****************************/
    /* Global Support Functions */
    /****************************/

    _read_parent_size(){
        return {'height': this.dyno_svg.get_height(), 'width': this.dyno_svg.get_width()};
    }

    _get_length(){
        if (this.axis_location == 'x_axis'){            
            return this.parent_size.width - (this.graph_margins.left + this.graph_margins.right);                            
        }
        
        return this.parent_size.height - (this.graph_margins.top + this.graph_margins.bottom);        
    }

    /******************/
    /* Line Functions */
    /******************/

    _calculate_line_position(){
        let length = this._get_length();

        if (this.axis_location == 'x_axis'){                        
            let y = this.parent_size.height - this.graph_margins.bottom;
            let x = this.graph_margins.left;            
            return [x, y, x+length, y];
        }

        let y_top = this.graph_margins.top;
        let y_bottom = this.parent_size.height - this.graph_margins.bottom;
        let x = (this.axis_location == 'y_left') ? this.graph_margins.left : this.parent_size.width - this.graph_margins.right;

        return [x, y_top, x, y_bottom];
    }

    _create_line(){
        let [x1, y1, x2, y2] = this._calculate_line_position();
        this.line = this.dyno_svg.line(x1, y1, x2, y2, LINE_WIDTH, LINE_COLOR, false);
        this.line_values = {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2};
    }

    
    /******************/
    /* Step Functions */
    /******************/

    _calculate_linear_step_count(){
        if (this.step_count > 0){
            let value_step = (this.labels_linear.max - this.labels_linear.min) / this.step_count;
            return [this.step_count, value_step]
        }

        let length = (this.axis_location == 'x_axis') ? this.parent_size.width : this.parent_size.height;
        let count = Math.floor(length/LINEAR_STEP_SIZE_DEFAULT);
        if (count == 0){
            return [1, 1]
        }

        let value_step = (this.labels_linear.max - this.labels_linear.min) / count;
        let numerator = Math.pow(10,Math.ceil(Math.log10(value_step)));
        let normalized = value_step / numerator;
        
        if (normalized <= 0.1){
            value_step = 0.1;
        } else if (normalized <= 0.20){
            value_step = 0.20;
        } else if (normalized <= 0.25){
            value_step = 0.25;
        } else if (normalized <= 0.5){
            value_step = 0.5;
        } else {
            value_step = 1;
        }

        value_step = value_step * numerator;
        count = ((this.labels_linear.max - this.labels_linear.min) / value_step) + 1;
        
        return [count, value_step]
    }
    
    /**
     * @return {{'count': number, 'width': number, 'edges': boolean, 'value_increment': number}}
     */

    _calculate_step_config(){        
        let config = {'count': 0, 'width': 0, 'edges': false, 'value_increment': -1};

        switch(this.axis_mode){
            case 'discreet':
                config.count = this.labels_discreet.length;
                config.edges = false;
                break;
            case 'linear':
                [config.count, config.value_increment] = this._calculate_linear_step_count();
                config.edges = true;
                break;
            default:
                console.error(`Unsupported axis_mode = ${this.axis_mode}`);
                break;
        }
        
        config.width = (config.edges == true) ? this._get_length() / (config.count - 1) : this._get_length() / (config.count + 1);
        
        return config;        
    }

    /**
     * @param {number} step_idx     
     */
    _calculate_stroke_pos(step_idx){
        let width_count = (this.step_config.edges == true) ? step_idx : step_idx + 1;
        let step_position = this.get_axis_start() + (width_count * this.step_config.width);
        return step_position;
    }

    /**
     * @param {number} pos
     */
    _calculate_stroke(pos){
        if (this.axis_location == 'x_axis'){
            let x = this._calculate_stroke_pos(pos);
            let y1 = this.parent_size.height - this.graph_margins.bottom - (STROKE_LENGTH / 2 );
            let y2 = this.parent_size.height - this.graph_margins.bottom + (STROKE_LENGTH / 2);

            return [x, y1, x, y2];
        }

        let y = this._calculate_stroke_pos(pos);        
        let x1 = this.graph_margins.left - (STROKE_LENGTH/2);
        let x2 = this.graph_margins.left + (STROKE_LENGTH/2);            

        if (this.axis_location == 'y_right'){
            let move_right = this.parent_size.width - (this.graph_margins.left + this.graph_margins.right);
            x1 = x1 + move_right;
            x2 = x2 + move_right;
        }

        return [x1, y, x2, y]
    }

    _create_steps(){        
        for (let step=0;step<this.step_config.count;step++){            
            let [x1, y1, x2, y2] = this._calculate_stroke(step);
            let line = this.dyno_svg.line(x1, y1, x2, y2, STROKE_WIDTH, STROKE_COLOR, false);
            this.step_lines.push(line);
        }
    }

    _remove_steps(){
        while (this.step_lines.length > 0){
            let step = this.step_lines.pop();
            step.remove();
        }
    }

    /*******************/
    /* Label Functions */
    /*******************/

    /**
     * @param {number} max_value
     */
    _get_decimal_places(max_value){
        if (max_value <= 1){
            return 4;
        }

        if (max_value <= 10){
            return 3;
        }

        if (max_value <= 100){
            return 2;
        }

        return 0;
    }

    /**
     * @return {string[]}
     */
    _generate_label_names(){
        if (this.axis_mode == 'discreet'){
            return this.labels_discreet;
        }

        let labels = [];
        let value = this.labels_linear.min;
        let decimal_places = this._get_decimal_places(this.labels_linear.max);
        for (let step=0;step<this.step_config.count;step++){
            labels.push(`${value.toFixed(decimal_places)}`);
            value = value + this.step_config.value_increment;
        }

        return labels;
    }

    _calc_label_width(){
        switch(this.axis_location){
            case 'x_axis':
                return this.step_config.width;
            case 'y_left':
                return this.graph_margins.left - STROKE_LENGTH;
            case 'y_right':
                return this.graph_margins.right - STROKE_LENGTH;
        }        
    }

    _calc_label_height(){
        switch(this.axis_location){
            case 'x_axis':
                return this.graph_margins.bottom - STROKE_LENGTH;
            case 'y_left':
                return Math.min(MAX_LABEL_HEIGHT, this.step_config.width);
            case 'y_right':
                return Math.min(MAX_LABEL_HEIGHT, this.step_config.width);
        }
    }
    
    _create_labels(){
        let label_width = this._calc_label_width();
        let label_height = this._calc_label_height();        
        let label_idx = 0; 
        let x = 0;
        let y = 0;       
        for (let label of this.label_names){
            let stroke_pos = this._calculate_stroke_pos(label_idx);
            if (this.axis_location == 'x_axis'){
                x = stroke_pos - (label_width/2);
                y = this.parent_size.height - this.graph_margins.bottom + STROKE_LENGTH + label_height/2;
            }

            if (this.axis_location == 'y_left'){
                x = MARGIN_LABEL_LEFT;
                y = this.parent_size.height + this.graph_margins.top - (stroke_pos + label_height);                               
            }

            if (this.axis_location == 'y_right'){
                x = this.parent_size.width - this.graph_margins.right + STROKE_LENGTH;
                y = this.parent_size.height + this.graph_margins.top - (stroke_pos + label_height);
                
            }

            let label_text = this.dyno_svg.text(label, x, y, LABEL_FONT_SIZE, label_width, label_height, 'black', 'center', 'center');            
            this.label_text.push(label_text);
            label_idx++;
        }
    }

    _remove_labels(){
        while(this.label_text.length > 0){
            let label_text = this.label_text.pop();
            label_text.remove();
        }
    }

    
    /*************************/
    /* Information Providers */
    /*************************/
    /**
     * @param {number} value 
     * @return {number} Returns start of axis if error
     */
    _get_position_from_value_linear(value){
        let value_offset = (value - this.labels_linear.min) / (this.labels_linear.max - this.labels_linear.min);
        let position_offset = value_offset * this._get_length();
        let position = position_offset + this.get_axis_start();        

        return position;
    }

    /**
     * @param {string} value
     */
    _get_position_from_value_disreet(value){
        let idx = this.labels_discreet.findIndex(function (element){ return element == value});
        if (idx == -1){
            console.error(`value not in labels ${JSON.stringify(this.labels_discreet)}`);
            return this.get_axis_start();
        }

        return this._calculate_stroke_pos(idx);
    }

    /**
     * @param {number} value
     * @return {number}
     */
    _correct_y_axis(value){
        if (this.axis_location == 'x_axis'){
            return value;
        }

        value = this.get_axis_end() - value + this.get_axis_start();
        return value;
    }

    /**
     * @param {number|string} value 
     * @return {number} Returns start of axis if error
     */
    get_position_from_value(value){                        
        if (this.axis_mode == 'linear'){        
            if (typeof value != 'number'){
                console.error(`value = ${value} must be a number`);
                return this.get_axis_start();
            }

            let position = this._get_position_from_value_linear(value);
            return this._correct_y_axis(position);
        } 

        let position = this._get_position_from_value_disreet(`${value}`);

        return this._correct_y_axis(position);
    }

    get_length(){
        return this._get_length();
    }

    get_type(){
        return this.axis_location;
    }

    /**
     * @return {'horizontal'|'vertical'} 
     */
    get_direction(){
        if (this.axis_location == 'x_axis'){
            return 'horizontal';
        }

        return 'vertical';
    }

    /**
     * @param {number} pos
     */
    get_tick_position(pos){
        return this._calculate_stroke_pos(pos);
    }

    get_step_width(){
        return this.step_config.width        
    }

    /**
     * @return {number}
    */
    get_max_value(){
        if (this.axis_mode == 'linear'){
            return this.labels_linear.max;
        }

        console.error('Only Supported for Linear Mode');

        return 0;
   }

    /**
     * @return {number}
    */

    get_min_value(){
        if (this.axis_mode == 'linear'){
            return this.labels_linear.min;
        }

        console.error('Only Supported for linear mode');

        return 0;
    }

    get_axis_end(){
        if (this.axis_location == 'x_axis'){
            return this.line_values.x2;
        }        
        return this.line_values.y2;
    }    

    get_axis_start(){
        if (this.axis_location == 'x_axis'){
            return this.line_values.x1;
        }

        return this.line_values.y1;
    }
}