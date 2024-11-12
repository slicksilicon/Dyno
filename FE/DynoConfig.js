const DEFAULT_STEP_SIZE = 50;
const DEFAULT_MIN_STEP_COUNT = 20;
const DEFAULT_BAR_SPACING = 10;

const GRAPH_MARGIN_TOP = 10;
const GRAPH_MARGIN_BOTTOM = 40;
const GRAPH_MARGIN_LEFT = 80;
const GRAPH_MARGIN_RIGHT = 50;

const DEFAULT_COLOR_SCHEME_CATEGORY = 'DEFAULT_CATEGORY';

export class DynoConfig{
    
    /**
     * @param {'bar'|'line'|'mixed'|'pie'|'bubble'|'radar'|'Heatmap'} graph_type
     */
    constructor(graph_type){
        this.graph_type = graph_type;

        /** @type {'landscape'|'potrait'} */
        this.bar_orientation = 'potrait';

        /** @type {{'y_min' : null|number, 'y_max' : null|number, 'x_min' : null|number, 'x_max' : null|number}} */
        this.axis_range = {'y_min': null, 'y_max': null, 'x_min': null, 'x_max': null}            
        
        /** @type {{'x': Boolean, 'y': Boolean}} */
        this.axis_round_up = {'x': true, 'y': true};
                                
        this.step_size      = DEFAULT_STEP_SIZE;     
        this.step_min_count = DEFAULT_MIN_STEP_COUNT;   
        this.bar_spacing    = DEFAULT_BAR_SPACING;

        /**
         * Overall Graph Margins
         * @type {{'left': number, 'right': number, 'top': number, 'bottom': number}}
         */
        this.graph_margin = {'left': GRAPH_MARGIN_LEFT, 'right': GRAPH_MARGIN_RIGHT, 'bottom': GRAPH_MARGIN_BOTTOM, 'top': GRAPH_MARGIN_TOP};

        /**@type {{[x: string] : string}} */
        this.color_schemes = {[DEFAULT_COLOR_SCHEME_CATEGORY] : 'mixed'};
        this.color_alpha = {};
        
        this.label_type = this._set_label_type('number');
       
        /** 
         * @type {{'min': number, 'max': number}} 
         *  Used for Radius of Bubble Chart Circle */
        this.range_radius = {'min': -1, 'max': -1};

        
        /**
         * Used for Radar Graph
         * @type {number|null}
         */
        this.radar_max_value = null;

    }

    /**
     * @param {'landscape'|'potrait'} orientation
     */
    set_bar_orientation(orientation){
        this.bar_orientation = orientation;
    }


    /**
     * @param {number|null} y_min
     * @param {number|null} y_max
     * @param {number|null} x_min
     * @param {number|null} x_max
     */
    set_axis_range(y_min, y_max, x_min, x_max){
        this.axis_range = {'y_min': y_min, 'y_max': y_max, 'x_min': x_min, 'x_max': x_max};       
    }

    /**
     * @param {boolean} y_axis
     * @param {boolean} x_axis
     */
    set_axis_roundup(y_axis, x_axis){
        this.axis_round_up = {'x': x_axis, 'y': y_axis};
    }

    /**
     * @param {number} min_count
     */
    set_step_min_count(min_count){
        this.step_min_count = min_count;
    }

    /**
     * @param {number} size
     */
    set_step_size(size){
        this.step_size = size;
    }

    /**
     * @param {number} spacing
     */
    set_bar_spacing(spacing){
        this.bar_spacing = spacing;
    }

    /**
     * @param {{[x: string]:string}} schemes     
     */
    set_color_schemes(schemes){
        this.color_schemes = Object.assign({}, this.color_schemes, schemes);       
    }

    /**
     * @param {'number'|'string'|'ringgit'|'usd'|'yen'|'gbp'|'percentage'} label_type
     * @return 
     */
    _set_label_type(label_type){
        return label_type;
    }

    /**
     * @param {'number'|'string'|'ringgit'|'usd'|'yen'|'gbp'|'percentage'} label_type
     */
    set_label_type(label_type){
        this.label_type = this._set_label_type(label_type);
    }

    

    /**
     * Rounds Up Value to the nearest 10's
     * @param {number} value
     * @return {number}
     */
    _round_up(value){        
        let log = Math.log10(value);
        log = Math.floor(log);
        let power = Math.pow(10, log);
        return Math.ceil(value/power) * power;
    }

    /**
     * @param {number[]} x_data
     * @param {number[]} y_data
     * @return {{min: number, max: number}[]}
     */
    calc_data_range(x_data, y_data){
        let x_min = (this.axis_range.x_min == null) ? Math.min(...x_data) : this.axis_range.x_min;
        let x_max = (this.axis_range.x_max == null) ? Math.max(...x_data) : this.axis_range.x_max;
        let y_min = (this.axis_range.y_min == null) ? Math.min(...y_data) : this.axis_range.y_min;
        let y_max = (this.axis_range.y_max == null) ? Math.min(...y_data) : this.axis_range.y_max;


        if (this.axis_round_up.x == true){
            x_max = this._round_up(x_max);
        }

        if (this.axis_round_up.y == true){
            y_max = this._round_up(y_max);
        }

        return [{'min': x_min, 'max': x_max},{'min': y_min, 'max': y_max}];
    }

    /**
     * @param {'height'|'width'|'both'} direction
     */
    get_graph_margin(direction){
        let margin_types = [];
        if (direction != 'width'){
            margin_types.push('top');
            margin_types.push('bottom');
        }

        if (direction != 'height'){
            margin_types.push('left');
            margin_types.push('right');
        }

        let sum = 0;
        for (const margin_type of margin_types){
            let value = this.graph_margin[margin_type];
            sum = sum + value;
        }

        return sum;

    }

    /**
     * @param {number} height
     * @param {number} width
     * @return {{'radius': number , 'cx': number, 'cy': number}}
     */
    get_circle_params(height, width){
        let circle = {'radius':0 , 'cx': 0, 'cy': 0};
        let clean_width = width - this.get_graph_margin('width');
        let clean_height = height - this.get_graph_margin('height');
        circle.radius = Math.min(clean_height/2, clean_width/2);

        circle.cx = this.graph_margin.left + (clean_width/2);
        circle.cy = this.graph_margin.top + (clean_height/2);

        return circle;
    }
}
