import { DynoAxis } from "./DynoAxis.js";
import { DynoSvg } from "./DynoSvg.js";
import { DynoConfig } from "./DynoConfig.js";

const LABEL_POSITION = {
    'empty' : {'empty': 'below', 'up': 'below', 'down': 'above', 'flat': 'below'},
    'up'    : {'empty': 'below', 'up': 'below', 'down': 'above', 'flat': 'left' },
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
const LABEL_MARGIN = 5;
const CIRCLE_SIZE = 3;

const IDX_X = 0
const IDX_Y = 1
const IDX_COUNT = 2

export class DynoLine{
    /**
     * @param {string|HTMLDivElement} id
     * @param {DynoConfig} config
     * @param {{[x:string]: number[][]}} data
     */
    constructor(id, config, data){
        this.svg = new DynoSvg(id);
        this.config = config;
        this.data = data;

        /* Internal Variables */
        this.lines = [];
        this.dots = [];
        this.labels = [];
        
        /* Range Config */
        this.categories = Object.keys(this.data);
        this.range_value = this._calc_range_value();
        this.axis = this._create_axis();

        /* Draw */
        this._draw();

        this.svg.add_resize_callback(this._resize.bind(this), true);

    }

    _create_array_of_idx_count(){
        let my_array = Array(IDX_COUNT);
        for (let idx=0;idx<IDX_COUNT;idx++){
            my_array[idx] = [];
        }

        return my_array;
    }

    /**
     * @return {{min: number, max: number}[]}
     */
    _calc_range_value(){
        let values = this._create_array_of_idx_count();
        for (const category of this.categories){
            for (const point of this.data[category]){
                for (let idx=0;idx<IDX_COUNT;idx++){
                    values[idx].push(point[idx]);
                }
            }
        }

        return this.config.calc_data_range(values[IDX_X], values[IDX_Y]);
    }

    _create_axis(){
        let axises = [];
        for (let idx=0;idx<IDX_COUNT;idx++){
            /**@type {'x_axis'|'y_left'} */
            let location = (idx == IDX_X) ? 'x_axis' : 'y_left';
            let axis = new DynoAxis(this.svg, location, 'linear', -1, this.range_value[idx], this.config.graph_margin);
            axises.push(axis);
        }

        return axises;
    }

    _resize(){
        this.range_value = this._calc_range_value();
        this.axis = this._create_axis();
        this._draw();
    }

    /**
     * @param {number[]} point
     * @return {string}
     */
    _make_label(point){
        let label = '(';
        for (let value of point){
            let decimal = 0;
            if (value < 1){
                decimal = 2;
            } else if (value < 10){
                decimal = 1;
            }

            if (label != '('){
                label = label + ', '
            }
            label = label + `${value.toFixed(decimal)}`;
        }
            
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
        let cx = this.axis[IDX_X].get_position_from_value(point[IDX_X]);
        let cy = this.axis[IDX_Y].get_position_from_value(point[IDX_Y]);

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
                
        let point_previous = (idx > 0) ? this._calc_point_position(this.data[category][idx-1]) : null;
        let point_start = this._calc_point_position(this.data[category][idx]);
        idx=idx+1;

        let point_end = null;        
        
        while (idx <= this.data[category].length){
            /* Draw Line */
            if (idx < this.data[category].length){
                point_end = this._calc_point_position(this.data[category][idx]);
                let line = this.svg.line(point_start[0], point_start[1], point_end[0], point_end[1], 2, 'black', false);
                this.lines.push(line);                                  
            }
            /* Draw Point Circle */
            let circle_param = {'cx': point_start[IDX_X], 'cy': point_start[IDX_Y], 'radius': CIRCLE_SIZE};
            let dot = this.svg.circle(circle_param,'black', 'black', 1, false); 
            this.dots.push(dot);

            /* Draw Label */
            let label_position = this._fix_label_position(point_previous, point_start, point_end);
            let label_point = this._add_label_offset(point_start, label_position);
            let vertical_position = LABEL_VERTICAL[label_position];
            let horizontal_position = LABEL_HORIZONTAL[label_position];

            let sentence = this._make_label(this.data[category][idx-1]);
            let label = this.svg.text(sentence, label_point[0], label_point[1], 18, LABEL_WIDTH, LABEL_HEIGHT, 'black', horizontal_position, vertical_position);
            this.labels.push(label);

            /* Increase Index */
            idx++;

            /* Shift Point Data */
            point_previous = point_start;
            if (point_end != null){
                point_start = point_end;
            }
            
        }        
    }

    _draw(){
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
}