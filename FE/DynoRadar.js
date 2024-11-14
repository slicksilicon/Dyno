import { DynoSvg } from "./DynoSvg.js";
import { DynoConfig } from "./DynoConfig.js";
import { get_colors, getAttributeStr,  get_text_color, DynoText} from "./DynoTools.js";

const ITEM_LABEL_HEIGHT     = 32;
const ITEM_LABEL_WIDTH      = 200;
const ITEM_LABEL_MARGIN     = 7;
const ITEM_LABEL_FONT_SIZE  = 24;

const DOT_RADIUS = 5;

const LABEL_POS_BOTTOM_LEFT = 0;
const LABEL_POS_BOTTOM_RIGHT= 1;
const LABEL_POS_TOP_LEFT    = 2;
const LABEL_POS_TOP_RIGHT   = 3;

const LABEL_EDGE_RIGHT = 0;
const LABEL_EDGE_BOTTOM = 1;
const LABEL_EDGE_LEFT = 2;
const LABEL_EDGE_TOP = 3;

export class DynoRadar{
    /**
     * @param {string|HTMLElement} id
     * @param {DynoConfig} config
     * @param {{[x:string]: {}}} data
     */
    constructor(id, data, config){  
        /* Store Parameters */
        this.svg = new DynoSvg(id);  
        this.config = config;    
        this.data = data;

        /* Create Derived Information */
        this.categories = Object.keys(data);        
        this.items = this._get_items();
        this.max_value = (this.config.radar_max_value == null) ? this._get_max_value() : this.config.radar_max_value;
        this.colors = get_colors(config.color_schemes, 'radar', 0.5, this.categories.length);        

        /* Draw */
        this.elements = {};
        this.circle_param = {'cx':0, 'cy':0, 'radius': 0};
        this._draw();

        this.svg.add_resize_callback(this._draw.bind(this), true);
    }

    _get_items(){
        let items = [];
        for (const category of this.categories){
            for (const item of Object.keys(this.data[category])){
                if (items.includes(item) == false){
                    items.push(item);
                }
            }
        }

        return items;
    }

    _get_max_value(){
        let max_value = 0;
        for (const category of this.categories){
            for (const value of Object.values(this.data[category])){
                max_value = (value > max_value) ? value : max_value;
            }
        }

        return max_value;
    }

    _get_circle_param(){
        let height = this.svg.get_height();
        let width  = this.svg.get_width();
        return this.config.get_circle_params(height, width);
    }

    /**
     * @param {number} value
     * @return {number}
     */
    _calc_radius_for_value(value){
        return this.circle_param.radius * (value / this.max_value);
    }

    /**     
     * @param {string} item
     */
    _calc_percentage_for_item(item){
        let idx = this.items.indexOf(item);
        if (idx === -1){
            console.error(`Invalid item = ${item}`);
            idx = 0;
        }

        return idx / this.items.length; 
    }

    /**
     * @param {string} item
     * @param {number} value
     */
    _calc_value_pos(item, value){
        let percentage = this._calc_percentage_for_item(item);        

        let circle_param = Object.assign({}, this.circle_param);
        circle_param.radius = this._calc_radius_for_value(value);

        return this.svg._calc_circumferance_pos(percentage, circle_param);        
    }

    _draw_circular_axis(){                
        let circle_param = Object.assign({}, this.circle_param);                     
        let circles = [];
        
        for (let idx=1;idx<=this.max_value;idx++){
            circle_param.radius = this._calc_radius_for_value(idx);
            let circle = this.svg.circle(circle_param, 'transparent', 'black', 2, false);
            circles.push(circle);
        }
        
        return circles;
    }

    /**
    * @param {number} angle
    */
    _quadrant(angle){
        if (angle < Math.PI/2){
            return LABEL_POS_BOTTOM_RIGHT;
        }

        if (angle < Math.PI){
            return LABEL_POS_BOTTOM_LEFT;
        }

        if (angle < 1.5 * Math.PI){
            return LABEL_POS_TOP_LEFT;
        }

        return LABEL_POS_TOP_RIGHT;
    }

    _draw_items(){
        let elements = [];
        let angle_step = (2*Math.PI) / this.items.length;
        let angle = 0;        
        for (const item of this.items){            
            /** Calculate and Draw Dot at outer most circle */
            let dot = { 
                'cx': this.circle_param.radius * Math.cos(angle) + this.circle_param.cx,
                'cy': this.circle_param.radius * Math.sin(angle) + this.circle_param.cy, 
                'radius': DOT_RADIUS
            };

            let dot_element = this.svg.circle(dot, 'black', 'black', 1, false);
            elements.push(dot_element);

            /** Angle is in which Quandrant and is it an Edge (90 degree) point */
            let quandrant = this._quadrant(angle);
            let edge = ((angle % (1.57)) < 0.1) ? Math.round(angle/1.57) : -1;
            
            /** Calculate Text Point & Adjust position according to Quandrat & Edge */
            let ry = dot.cy;
            let rx = dot.cx;
            /**@type {'left'|'right'|'center'} */
            let horizontal = 'left';
            /**@type {'top'|'bottom'|'center'} */
            let vertical = 'top';
        
            if (quandrant == LABEL_POS_BOTTOM_LEFT){ 
                rx = rx - ITEM_LABEL_WIDTH;
                horizontal = 'right';
                vertical = 'center';
            }
    
            if (quandrant == LABEL_POS_TOP_LEFT){
                rx = rx - ITEM_LABEL_WIDTH;
                ry = ry - ITEM_LABEL_HEIGHT;
                horizontal = 'right';
                vertical = 'center';
            }
    
            if (quandrant == LABEL_POS_TOP_RIGHT){
                ry = ry - ITEM_LABEL_HEIGHT;
                horizontal = 'left';
                vertical = 'center';
            }
    
            if (edge == LABEL_EDGE_RIGHT){
                ry = ry - (ITEM_LABEL_HEIGHT/2);
                rx = rx + ITEM_LABEL_MARGIN;
                horizontal = 'left';
                vertical = 'center';
            }
    
            if (edge == LABEL_EDGE_BOTTOM){
                rx = rx + ITEM_LABEL_WIDTH/2;
                ry = ry + ITEM_LABEL_MARGIN;
                horizontal = 'center';
                vertical = 'center';
            }
    
            if (edge == LABEL_EDGE_LEFT){
                ry = ry + (ITEM_LABEL_HEIGHT/2);
                rx = rx - ITEM_LABEL_MARGIN;
                horizontal = 'right';
                vertical = 'center';
            }
    
            if (edge == LABEL_EDGE_TOP){            
                rx = rx - ITEM_LABEL_WIDTH/2;
                ry = ry - ITEM_LABEL_MARGIN;
                horizontal = 'center';
                vertical = 'center';
            }
                        
            let text_element = this.svg.text(item, rx, ry+ITEM_LABEL_HEIGHT/2, 24, ITEM_LABEL_WIDTH, ITEM_LABEL_HEIGHT, 'red', horizontal, vertical);

            elements.push(text_element);
            angle += angle_step;    
        }

        return elements;

    }

    /**
     * @param {{'cx': number, 'cy':number}[]} positions
     * @param {string} category
     */
    _draw_path(positions, category){
        let instruction = `M `;
        for (const position of positions){
            instruction = instruction + `${position.cx} ${position.cy} L`;
        }

        instruction = instruction + `${positions[0].cx} ${positions[0].cy}`;
        let clr_idx = this.categories.indexOf(category);        

        let path = this.svg.path(instruction, 1, 'black', this.colors[clr_idx]);        

        return path;
    }

    _draw_polygons(){
        let elements = [];
        for (const category of this.categories){
            let cat_pos = [];
            for (const item of this.items){
                let value = this.data[category][item];
                if (typeof value === 'undefined'){
                    value = 0;
                }

                let param = this._calc_value_pos(item, value);
                cat_pos.push(param);
            }

            let polygon = this._draw_path(cat_pos, category);
            elements.push(polygon);
        }
    }

    _draw(){        
        this.circle_param = this._get_circle_param();
        this.elements['axis'] = this._draw_circular_axis();
        this.elements['items'] = this._draw_items();
        this.elements['polygon'] = this._draw_polygons();
    }

}