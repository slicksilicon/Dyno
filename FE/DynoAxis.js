import { DynoSvg } from "./DynoSvg.js";
import { DynoText } from "./DynoText.js";
import './DynoTypedef.js';

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
const LABEL_MARGIN_X = 15;
const LABEL_MARGIN_Y = 5;

/* Configuration Defaults */
const DEFAULT_LABEL = 'number';
const DEFAULT_CURRENCY = 'ringgit';
const DEFAULT_DATE = 'full';



export class DynoAxis{
    
    /**
     * @param {DynoSvg} dyno_svg
     * @param {AXIS_POSITION} axis_location
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number}} graph_margins
     */

    constructor(dyno_svg, axis_location, graph_margins){
        this.dyno_svg       = dyno_svg;
        this.axis_location  = axis_location;
        this.graph_margins = graph_margins;

        /**@type TYPE_AXIS_MODE */
        this.axis_mode = 'linear';

        /**@type TYPE_LABEL_CONFIG */
        this.label_config = {'mode': 'number', 'currency': DEFAULT_CURRENCY, 'date': DEFAULT_DATE};

        /* Labels */
        /**@type {string[]} */
        this.labels = [];
        this.label_svgs = [];

        /**@type {{'min': number, 'max': number, 'steps': number|null}} */
        this.axis_range = {'min': 0, 'max': 0, 'steps': 0};

        /**@type {{'min': number|null, 'max': number|null}} */
        this.axis_range_user = {'min': null, 'max': null};
        
        /* Setup Parent */
        this.parent_size = this._read_parent_size();        

        /* Line */
        this.line_svg = null;
        this.line_values = {'x1': 0, 'y1': 0, 'x2': 0, 'y2': 0};
        
        
        /* Steps */
        /**@type {{'count': number, 'width': number, 'edges': boolean, 'value_increment': number}} */
        this.step_config = {'count': 0, 'width': 0, 'edges': false, 'value_increment': 0};
        this.step_svgs = [];        
    }

    /************************/
    /* Data Setup Functions */
    /************************/

    /**
     * @param {number | null} range_min
     * @param {number | null} range_max
     * @param {number | null} step_count
     */
    _check_linear_data(range_min, range_max, step_count){
        if ((range_max != null && range_min != null) && (range_max < range_min)){
            console.error(`Range is inverted => max=${range_max} min=${range_min}`);
            return false;
        }

        if ((step_count != null) && (step_count <= 0)){
            console.error(`Step Count >= 0 but step_count = ${step_count}`);
            return false;
        }

        return true;
    }

    /**
     * @param {null|number} range_min
     * @param {null|number} range_max
     * @param {null|number} step_count
     * @param {number[]} data
     */
    _update_axis_range(range_min, range_max, step_count, data){
        this.axis_range_user.min = (range_min == null) ? this.axis_range_user.min : range_min;
        this.axis_range_user.max = (range_max == null) ? this.axis_range_user.max : range_max;

        let calc_min = (this.axis_range_user.min == null) ? Math.min(...data) : this.axis_range_user.min;
        let calc_max = (this.axis_range_user.max == null) ? Math.max(...data) : this.axis_range_user.max;

        this.axis_range = {'min': calc_min, 'max': calc_max, 'steps': step_count};
        this.axis_mode  = 'linear';
    }

    /**
     * @param {number[]} data
     * @param {'number'|'currency'|'percentage'} data_mode     
     * @param {TYPE_LABEL_CURRENCY|null} currency_type
     * @param {number|null} range_min
     * @param {number|null} range_max
     * @param {number|null} step_count     
     */
    set_linear_data(data, data_mode, currency_type, range_min, range_max, step_count){        
        if (this._check_linear_data(range_min, range_max, step_count) == false){
            return;
        }

        this._update_axis_range(range_min, range_max, step_count, data);

        if (currency_type == null){
            currency_type = DEFAULT_CURRENCY;
        }

        this.label_config.mode      = data_mode;
        this.label_config.currency  = currency_type;
        this.label_config.date      = DEFAULT_DATE
        
        this.draw();
    }

    /**
     * @param {Date[]} data
     * @param {TYPE_LABEL_DATE} date_config 
     * @param {Date|null} range_min
     * @param {Date|null} range_max
     * @param {number|null} step_count     
     */
    set_linear_date(data, date_config, range_min, range_max, step_count){
        let value_min = (range_min == null) ? null : range_min.getTime();
        let value_max = (range_max == null) ? null : range_max.getTime();

        if (this._check_linear_data(value_min, value_max, step_count) == false){
            return;
        }

        let values = [];
        for (let date of data){
            try{
                values.push(date.getTime());
            } catch{
                console.error(`Error Converting to time for => ${date}`);
            }
            
        }

        this._update_axis_range(value_min, value_max, step_count, values);

        this.label_config.mode      = 'date';
        this.label_config.currency  = DEFAULT_CURRENCY;
        this.label_config.date      = date_config;

        this.draw();
    }

    /**
     * @param {string[]} data
     */
    set_discreet_data(data){
        this.label_config.currency  = DEFAULT_CURRENCY;
        this.label_config.date      = DEFAULT_DATE;
        this.label_config.mode      = 'string';
        this.axis_mode = 'discreet';

        this.labels = data;

        this.draw();
    }

    /**
     * @param {Date[]} data
     * @param {TYPE_LABEL_DATE} date_mode
     */
    set_discreet_dates(data, date_mode){
        this.label_config.currency  = DEFAULT_CURRENCY;
        this.label_config.date      = date_mode;
        this.label_config.mode      = 'date';

        this.labels.length = 0;
        let dyno_text = new DynoText('date', date_mode, DEFAULT_CURRENCY, null);
        for (let date of data){
            this.labels.push(dyno_text.display_value_string(date))
        }
        
        this.draw();
    }

    /**
     * @param {number|null} min
     * @param {number|null} max
     */
    set_range(min, max){
        let check_min = (min == null) ? this.axis_range_user.min : min;
        let check_max = (max == null) ? this.axis_range_user.max : max;
        
        if (check_min != null && check_max != null && check_min >= check_max){
            console.error(`User Range Invalid [${check_min}] >= [${check_max}]`);
            return;
        }
        
        this.axis_range_user.min = min;
        this.axis_range_user.max = max;
    }

    /*************/
    /* Draw Axis */
    /*************/
    
    draw(){
        this._calculate_step_config();
        this._generate_label_names();

        this._draw_line();        
        this._draw_steps();
        this._draw_labels();        
    }

    remove(){
        this._remove_line();        
        this._remove_steps();
        this._remove_labels();
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

    _draw_line(){
        let [x1, y1, x2, y2] = this._calculate_line_position();
        this.line_svg = this.dyno_svg.line(x1, y1, x2, y2, LINE_WIDTH, LINE_COLOR, false);
        this.line_values = {'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2};
    }

    _remove_line(){
        if (this.line_svg != null){
            this.line_svg.remove();
        }
    }
    
    /******************/
    /* Step Functions */
    /******************/

    _calculate_step_config_linear(){
        let length = this._get_length();
        let value_delta = this.axis_range.max - this.axis_range.min;
        this.step_config.edges = true;

        if (length == 0){
            console.error('Length of Axis is zero');
            this.step_config.count = 1;
            this.step_config.value_increment = 1;
            this.step_config.width = length;
            return;
        }

        if (this.axis_range.steps != null){
            if (this.axis_range.steps <= 0){
                console.error(`Invalid Value of axis_range.steps = ${this.axis_range.steps}. Must > 0`);
                return;
            }

            this.step_config.value_increment = value_delta / this.axis_range.steps;
            this.step_config.count = this.axis_range.steps;    
            this.step_config.width = length / this.step_config.count;        
            return;
        }

        
        let count = Math.floor(length/LINEAR_STEP_SIZE_DEFAULT);
        let value_step = value_delta / count;
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

        this.step_config.value_increment = value_step * numerator;   
        this.step_config.count = Math.ceil((value_delta / this.step_config.value_increment)) + 1;
        

        // this.step_config.count = (value_delta / this.step_config.value_increment) + 1;
        this.step_config.width = length / (this.step_config.count - 1);
    }

    _calculate_step_config(){        
        switch(this.axis_mode){
            case 'discreet':
                this.step_config.count = this.labels.length;
                this.step_config.edges = false;
                this.step_config.value_increment = -1;
                this.step_config.width = this._get_length() / this.step_config.count;
                break;
            case 'linear':
                this._calculate_step_config_linear();                                
                break;
            default:
                console.error(`Unsupported axis_mode = ${this.axis_mode}`);
                break;
        }
    }

    /**
     * @param {number} step_idx     
     */
    _calculate_stroke_pos(step_idx){
        let width_count = (this.step_config.edges == true) ? step_idx : step_idx + 0.5;
        let step_position =(this.axis_location == 'x_axis') ? this.get_axis_start() + (width_count * this.step_config.width) :
                                                              this.get_axis_end() - (width_count * this.step_config.width);
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

        let y =  this._calculate_stroke_pos(pos);
        let x1 = this.graph_margins.left - (STROKE_LENGTH/2);
        let x2 = this.graph_margins.left + (STROKE_LENGTH/2);            

        if (this.axis_location == 'y_right'){
            let move_right = this.parent_size.width - (this.graph_margins.left + this.graph_margins.right);
            x1 = x1 + move_right;
            x2 = x2 + move_right;
        }

        return [x1, y, x2, y]
    }

    _draw_steps(){
        this.step_svgs.length = 0;        
        for (let step=0;step<this.step_config.count;step++){            
            let [x1, y1, x2, y2] = this._calculate_stroke(step);
            let line = this.dyno_svg.line(x1, y1, x2, y2, STROKE_WIDTH, STROKE_COLOR, false);
            this.step_svgs.push(line);
        }
    }

    _remove_steps(){
        while (this.step_svgs.length > 0){
            let step = this.step_svgs.pop();
            step.remove();
        }
    }

    /*******************/
    /* Label Functions */
    /*******************/

    _generate_label_names(){
        if (this.axis_mode == 'discreet'){
           return;
        }

        this.labels.length = 0;        
        let dyno_text = new DynoText(this.label_config.mode, this.label_config.date, this.label_config.currency, this.axis_range.max);
        
        let value = this.axis_range.min;        
        for (let step=0;step<this.step_config.count;step++){
            let text = dyno_text.display_value_string(value);
            this.labels.push(text);            
            value = value + this.step_config.value_increment;
        }        
    }

    _calc_label_width(){
        switch(this.axis_location){
            case 'x_axis':
                let width = this.step_config.width - (LABEL_MARGIN_X*2);
                if (width < 20){
                    width = this.step_config.width;                    
                }
                return width;
            case 'y_left':
                return this.graph_margins.left - STROKE_LENGTH - LABEL_MARGIN_Y;
            case 'y_right':
                return this.graph_margins.right - STROKE_LENGTH - LABEL_MARGIN_Y;
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
    
    _draw_labels(){        
        let label_width = this._calc_label_width();
        let label_height = this._calc_label_height();        
        let label_idx = 0; 
        let x = 0;
        let y = 0;       

        for (let label of this.labels){
            let stroke_pos = this._calculate_stroke_pos(label_idx);
            if (this.axis_location == 'x_axis'){
                x = stroke_pos - (label_width/2);
                y = this.parent_size.height - this.graph_margins.bottom + STROKE_LENGTH + label_height/2;
            }

            if (this.axis_location == 'y_left'){
                x = MARGIN_LABEL_LEFT;
                // y = this.parent_size.height + this.graph_margins.top - (stroke_pos + label_height);
                y = stroke_pos;                               
            }

            if (this.axis_location == 'y_right'){
                x = this.parent_size.width - this.graph_margins.right + STROKE_LENGTH;
                y = this.parent_size.height + this.graph_margins.top - (stroke_pos + label_height);
                
            }

            let label_svg = this.dyno_svg.text(label, x, y, LABEL_FONT_SIZE, label_width, label_height, 'black', 'center', 'center');            
            this.label_svgs.push(label_svg);
            label_idx++;
        }
    }

    _remove_labels(){
        while(this.label_svgs.length > 0){
            let label_text = this.label_svgs.pop();
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
        let value_offset = (value - this.axis_range.min) / (this.axis_range.max - this.axis_range.min);
        let position_offset = value_offset * this._get_length();
        let position = position_offset + this.get_axis_start();        

        return position;
    }

    /**
     * @param {string} value
     */
    _get_position_from_value_disreet(value){
        let idx = this.labels.findIndex(function (element){ return element == value});
        if (idx == -1){
            console.error(`value not in labels ${JSON.stringify(this.labels)}`);
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
        if (this.axis_mode == 'discreet'){
            let position = this._get_position_from_value_disreet(`${value}`);
            return this._correct_y_axis(position);
        }
                
        /** Linear **/
        if (typeof value === 'string'){
            value = parseFloat(value);
            if (Number.isNaN(value) == true){
                console.error(`Failed to convert ${value}`);
                return this.get_axis_start();
            }            
        }

        if (typeof value === 'object'){
            try{
                //@ts-ignore
                value = value.getTime();
            } catch {
                console.error(`Failed to get Time from an object type ... ${value}`);
                return this.get_axis_start();
            }
        }

        
        //@ts-ignore
        let position = this._get_position_from_value_linear(value);
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
            return this.axis_range.max;
        }

        console.error('Only Supported for Linear Mode');

        return 0;
   }

    /**
     * @return {number}
    */

    get_min_value(){
        if (this.axis_mode == 'linear'){
            return this.axis_range.min;
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