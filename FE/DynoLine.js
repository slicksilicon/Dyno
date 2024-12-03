import { DynoAxis } from "./DynoAxis.js";
import { DynoSvg } from "./DynoSvg.js";
import { DynoText } from "./DynoText.js";
import { DynoColors } from "./DynoColors.js"

const LABEL_POSITION = {
    'empty' : {'empty': 'below', 'up': 'below', 'down': 'above', 'flat': 'below'},
    'up'    : {'empty': 'below', 'up': 'left', 'down': 'above', 'flat': 'left' },
    'down'  : {'empty': 'above', 'up': 'left' , 'down': 'left', 'flat': 'below'},
    'flat'  : {'empty': 'below', 'up': 'right', 'down': 'above', 'flat': 'below'}
}

/**@type {{[x:string]:'top'|'bottom'|'center'}} */
const LABEL_VERTICAL = {
    'below': 'top',
    'above': 'bottom',
    'left' : 'center',
    'right': 'center',
}

/**@type {{[x:string]:'left'|'right'|'center'}} */
const LABEL_HORIZONTAL = {
    'below' : 'center',
    'above' : 'center',
    'left'  : 'right',
    'right' : 'left'
}

const LABEL_WIDTH = 150;
const LABEL_HEIGHT = 24;
const LABEL_MARGIN = 12;
const CIRCLE_SIZE = 3;

const IDX_X = 0
const IDX_Y = 1
const IDX_COUNT = 2

/**@type {TYPE_LABEL_CONFIG} */
const default_label_config = {'mode': 'number', 'currency': 'ringgit', 'date': 'full'};

const default_range = {'min': null, 'max': null};

/**@typedef {Element[]} ELEMENT_ARRAY*/

export class DynoLine{
    /**
     * @param {string | HTMLElement} id
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number}} graph_margins
     */
    constructor(id, graph_margins){
        this.svg = new DynoSvg(id);
        this.svg.add_resize_callback(this._resize.bind(this), true);
        
        this.graph_margins = graph_margins;

        /* Internal Variables */
        /**@type {ELEMENT_ARRAY} */
        this.lines  = [];
        /**@type {ELEMENT_ARRAY} */
        this.dots   = [];
        /**@type {ELEMENT_ARRAY} */
        this.labels = [];

        /** Configuration Data **/
        /**@type {{'x_axis': TYPE_AXIS_MODE, 'y_axis': TYPE_AXIS_MODE}} */
        this.axis_mode = {'x_axis': 'linear', 'y_axis': 'linear'};

        /**@type {{'x_axis': TYPE_LABEL_CONFIG, 'y_axis': TYPE_LABEL_CONFIG}} */
        this.label_config = {'x_axis': {...default_label_config}, 'y_axis': {...default_label_config}};

        this.dyno_text = {  'x_axis': new DynoText(default_label_config.mode, default_label_config.date, default_label_config.currency, null),
                            'y_axis' : new DynoText(default_label_config.mode, default_label_config.date, default_label_config.currency, null)
                        }        
        
        /**@type {{'x_axis':{'min': number|Date|null, 'max':number|Date|null}, 'y_axis':{'min': number|Date|null, 'max':number|Date|null}}} */        
        this.axis_range = {'x_axis' : {...default_range}, 'y_axis': {...default_range}};

        /**@type {{[x:string] : number[][]}} */
        this.data = {};

        /**@type {{'x_axis': null|DynoAxis, 'y_axis': null|DynoAxis}} */
        this.axis = {'x_axis': null, 'y_axis': null}

        /**@type {string[]} */
        this.categories = [];
        
        /**@type {DynoColors} */
        this.dyno_colors = new DynoColors();
    }

    /**
     * @param {AXIS} axis
     */
    _update_dyno_text(axis){
        this.dyno_text[axis].set_mode(this.label_config[axis].mode);
        this.dyno_text[axis].set_currency_type(this.label_config[axis].currency);
        this.dyno_text[axis].set_date_type(this.label_config[axis].date);
    }

    /**
     * @param {string} category
     */
    _get_category_index(category){
        return this.categories.findIndex((cat) => cat == category);
    }

    /*******************/
    /* Configure Graph */
    /*******************/

    /**
     * @param {AXIS} axis
     * @param {TYPE_AXIS_MODE} mode
     */
    set_axis_mode(axis, mode){
        this.axis_mode[axis] = mode;
    }

    /**
     * @param {AXIS} axis
     * @param {TYPE_LABEL_DATE} date_type
     */
    set_axis_data_date(axis, date_type){
        this.label_config[axis].mode = 'date';
        this.label_config[axis].date = date_type;
        
        this._update_dyno_text(axis);
    }

    /**
     * @param {AXIS} axis
     * @param {TYPE_LABEL_CURRENCY} currency_type
     */
    set_axis_data_currency(axis, currency_type){
        this.label_config[axis].mode = 'currency';
        this.label_config[axis].currency = currency_type;     
        
        this._update_dyno_text(axis);
    }
    

    /**
     * @param {AXIS} axis
     */
    set_axis_data_percentage(axis){
        this.label_config[axis].mode = 'percentage';
        this._update_dyno_text(axis);
    }

    /**
     * @param {AXIS} axis
     */
    set_axis_data_number(axis){
        this.label_config[axis].mode = 'number';
        this._update_dyno_text(axis);
    }

    /**
     * @param {string} scheme
     * @param {number} alpha
     * @return {boolean}
     */
    set_color_scheme(scheme, alpha){
        return this.dyno_colors.set_scheme_alpha(scheme, alpha);
    }

       
    /**
     * @param {AXIS} axis
     * @param {number | Date | null} min
     * @param {number | Date | null} max
     */
    set_axis_range(axis, min, max){
        this.axis_range[axis].min = min;
        this.axis_range[axis].max = max;
    }

    _create_array_of_idx_count(){
        let my_array = Array(IDX_COUNT);
        for (let idx=0;idx<IDX_COUNT;idx++){
            my_array[idx] = [];
        }

        return my_array;
    }

    _extract_point_data(){        
        let values = this._create_array_of_idx_count();
        for (const category of this.categories){
            for (const point of this.data[category]){
                for (let idx=0;idx<IDX_COUNT;idx++){
                    values[idx].push(point[idx]);
                }
            }
        }

        return values;
    }

    /**
     * @param {AXIS} axis
     * @param {[]} range
     */
    _create_axis_single(axis, range){

        /** Create Axis **/

        /**@type {AXIS_POSITION} */
        let axis_position = (axis == 'x_axis') ? 'x_axis' : 'y_left';
        this.axis[axis] = new DynoAxis(this.svg, axis_position, this.graph_margins);

        /** Set Range Date **/
        if (this.label_config[axis].mode == 'date'){
            if (typeof this.axis_range[axis].min == 'number' || typeof this.axis_range[axis].max === 'number'){
                console.error(`min value is not date => ${JSON.stringify(this.axis_range[axis])}`);
                return;
            }

            if (this.axis_mode[axis] == 'linear'){
                this.axis[axis].set_linear_date(range, this.label_config[axis].date, this.axis_range[axis].min, this.axis_range[axis].max, null);
                return;
            }

            if (this.axis_mode[axis] == 'discreet'){
                this.axis[axis].set_discreet_dates(range, this.label_config[axis].date);
                return;
            }

            console.error(`Unsupport axis mode ${this.axis_mode[axis]}`);
            return;
        }
        
        /** Set Range Non Date */

        if (this.axis_mode[axis] == 'linear'){
            if (this.label_config[axis].mode == 'string'){
                console.error('Label Config cannot be string in linear mode');
                return;
            }

            if ( (typeof this.axis_range[axis].min !== 'number' && this.axis_range[axis].min != null) || (typeof this.axis_range[axis].max !== 'number' && this.axis_range[axis].max != null)){
                console.error(`min value is not date => ${JSON.stringify(this.axis_range[axis])}`);
                return;
            }
        
            this.axis[axis].set_linear_data(range, this.label_config[axis].mode, this.label_config[axis].currency, this.axis_range[axis].min, this.axis_range[axis].max, null);
        }        
    }

    _create_axis(){
        /** Calculate Range */
        let ranges = this._extract_point_data();
        this._create_axis_single('x_axis', ranges[IDX_X]);
        this._create_axis_single('y_axis', ranges[IDX_Y]);
    }

    _resize(){        
        this.draw(this.data);
    }

    /**
     * @param {number[]} point
     * @return {string}
     */
    _make_label(point){        
        let label = '(';

        label = label + this.dyno_text.x_axis.display_value_string(point[IDX_X]);
        label = label + ', ';
        label = label + this.dyno_text.y_axis.display_value_string(point[IDX_Y]);
            
        label = label + ')';

        return label;
    }

    /**
     * @param {number[]} point1
     * @param {number[]} point2
     * @return {'flat'|'up'|'down'}
     */
    _calc_line_gradient(point1, point2){
        let gradient = (point1[0] == point2[0]) ? null : (point1[1] - point2[1]) / (point1[0] - point2[0]);
        if (gradient == null || Math.abs(gradient) < 0.1){
            return 'flat';
        }

        if (gradient < 0){
            return 'up';
        }

        return 'down';        
    }

    /**
     * @param {null|number[]} previous_point
     * @param {number[]} point
     * @param {null|number[]} next_point
     * @return {'above'|'below'|'left'|'right'}
     */
    _fix_label_position(previous_point, point, next_point){
        let incoming = 'empty';
        let outgoing = 'empty'
        if (previous_point != null){
            incoming = this._calc_line_gradient(previous_point, point);
        }

        if (next_point != null){
            outgoing = this._calc_line_gradient(point, next_point);
        }

        return LABEL_POSITION[incoming][outgoing];
    }

    /**
     * @param {number[]} point
     * @param {'above'|'below'|'left'|'right'} position
     */
    _add_label_offset(point, position){  
        let label_point = [0,0];      

        if (position == 'left'){
            label_point[0] = point[0] - LABEL_WIDTH;
            label_point[1] = point[1] - (LABEL_HEIGHT / 2);
            return label_point;
        }

        if (position == 'right'){
            label_point[0] = point[0] + LABEL_MARGIN;
            label_point[1] = point[1] - (LABEL_HEIGHT/2);
            return label_point;
        }

        if (position == 'above'){
            label_point[0] = point[0] - (LABEL_WIDTH/2);
            label_point[1] = point[1] - LABEL_HEIGHT - LABEL_MARGIN;
            return label_point;
        }

        label_point[0] = point[0] - (LABEL_WIDTH / 2)
        label_point[1] = point[1] + LABEL_MARGIN;
        
        return label_point;
    }
        
    /**
     * @param {number[]} point
     * @return {number[]}
     */
    _calc_point_position(point){
        if (this.axis['x_axis'] == null || this.axis['y_axis'] == null){
            console.error(`Axis value is null ${JSON.stringify(this.axis)}`);
            return [0,0];
        }

        let cx = this.axis['x_axis'].get_position_from_value(point[IDX_X]);
        let cy = this.axis['y_axis'].get_position_from_value(point[IDX_Y]);

        return [cx, cy];
    }
    
    /**
     * @param {string} category
     * @param {number} idx
     */
    _draw_category(category, idx){
        if (this.data[category].length == 0){
            return;
        }

        let color = this.dyno_colors.get_color(this._get_category_index(category));
                
        let point_previous = (idx > 0) ? this._calc_point_position(this.data[category][idx-1]) : null;
        let point_start = this._calc_point_position(this.data[category][idx]);
        idx=idx+1;

        let point_end = null;        
        
        while (idx <= this.data[category].length){
            /* Draw Line */
            if (idx < this.data[category].length){
                point_end = this._calc_point_position(this.data[category][idx]);
                let line = this.svg.line(point_start[0], point_start[1], point_end[0], point_end[1], 2, color, false);
                this.lines.push(line);                                  
            }
            /* Draw Point Circle */
            let circle_param = {'cx': point_start[IDX_X], 'cy': point_start[IDX_Y], 'radius': CIRCLE_SIZE};
            let dot = this.svg.circle(circle_param,color, color, 1, false); 
            this.dots.push(dot);

            /* Draw Label */
            let label_position = this._fix_label_position(point_previous, point_start, point_end);
            let label_point = this._add_label_offset(point_start, label_position);
            let vertical_position = LABEL_VERTICAL[label_position];
            let horizontal_position = LABEL_HORIZONTAL[label_position];


            let sentence = this._make_label(this.data[category][idx-1]);
            let label = this.svg.text(sentence, label_point[0], label_point[1], 18, LABEL_WIDTH, LABEL_HEIGHT, 'black', horizontal_position, vertical_position);
            this.labels.push(label);

            /** Correct for left Most Label which will overlap with Exist */
            if (point_previous == null){
                label_point[IDX_X] = label_point[IDX_X] + label.getBoundingClientRect().width / 2 + 3;
                label.setAttribute('x', `${label_point[IDX_X]}`);    
            }

            /* Increase Index */
            idx++;

            /* Shift Point Data */
            point_previous = point_start;
            if (point_end != null){
                point_start = point_end;
            }
            
        }        
    }

    _clear(){
        this.svg.remove_elements();

        for (let axis of Object.keys(this.axis)){
            this.axis[axis] = null;
        }
        /** Clear Internal Holders */
        this.lines.length = 0;
        this.dots.length = 0;
        this.labels.length = 0;
    }

    /**
     * @param {{ [x: string]: number[][]; }} data
     */
    draw(data){
        /** Clears Any Existing Drawings **/
        this._clear();

        /** Parses Incoming data **/
        this.categories = Object.keys(data);        
        this.data = data;

        /** Update Colors */
        this.dyno_colors.set_count(this.categories.length)
        

        /** Draws Axis **/
        this._create_axis();
                
        /** Draws Line Graph Category at a time */
        for (const category of this.categories){
            this._draw_category(category, 0);
        }
    }

    /**
     * @param {string} category
     * @param {number[]} point
     */
    add_point(category, point){
        this.data[category].push(point);
        let idx = (this.data[category].length == 1) ? 0 : this.data[category].length - 2;
        let previous_label = this.labels.pop();
        if (typeof previous_label !== 'undefined'){
            previous_label.remove();
        }
        
        this._draw_category(category, idx);
    }

    /**
     * @param {string} category
     * @param {number[][]} point_data
     */
    add_category(category, point_data){        
        this.categories.push(category);
        this.data[category] = point_data;

        this._draw_category(category, 0);
    }
}