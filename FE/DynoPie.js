import { MY_FILL, DynoSvg } from "./DynoSvg.js";
import { getAttributeStr } from "./DynoTools.js";
import { DynoColors, get_text_color } from "./DynoColors.js";
import { DynoText } from "./DynoText.js";

const LABEL_HEIGHT = 50;
const LABEL_WIDTH = 200;
const LABEL_SPACING = 5;
const FONT_SIZE = 24;

const DEFAULT_COLOR_SCEHEME = 'mixed';
const DEFAULT_COLOR_ALPHA   = 0.8;

const DEFAULT_LABEL_MODE        = 'number';
const DEFAULT_LABEL_DATE        = 'full';
const DEFAULT_LABEL_CURRENCY    = 'ringgit';

export class DynoPie{
    
    /**
     * @param {string|HTMLElement} id 
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number}} graph_margins    
     */
    constructor(id, graph_margins){
        this.dyno_svg = new DynoSvg(id);        

        /**@type {{[x:string] : number}} */
        this.data = {};   

        /**@type {{'left': number, 'right': number, 'top': number, 'bottom': number}} */
        this.graph_margins = graph_margins;

        /**@type {{[x:string] : {'value': number, 'percentage': number, 'color': string}}} */
        this.slices = {};

        /**@type {DynoColors} */
        this.dyno_colors = new DynoColors();
        this.dyno_colors.set_scheme_alpha(DEFAULT_COLOR_SCEHEME, DEFAULT_COLOR_ALPHA);

        /**@type {DynoText} */
        this.dyno_text = new DynoText(DEFAULT_LABEL_MODE, DEFAULT_LABEL_DATE, DEFAULT_LABEL_CURRENCY, null);
        
        this.dyno_svg.add_resize_callback(this._resize.bind(this), true);
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
     * @param {TYPE_LABEL_MODE | null} mode
     * @param {TYPE_LABEL_CURRENCY | null} currency
     * @param {TYPE_LABEL_DATE | null} date
     */
    set_label_format(mode, currency, date){
        if (mode != null){            
            this.dyno_text.set_mode(mode);
        }

        if (currency != null){
            this.dyno_text.set_currency_type(currency);
        }

        if (date != null){
            this.dyno_text.set_date_type(date);            
        }
    }

    /**
     * @param {{ [x: string]: number; }} data
     */
    draw(data){
        this.data = data;
        this.dyno_colors.set_count(Object.keys(data).length);

        this._parse();
        this._draw();
    }

    _parse(){
        this.slices = {};
        let total = Object.values(this.data).reduce((a,b) => a+b, 0);
        let idx = 0;
        for (let category in this.data){
            let slice = {}
            slice['value'] = this.data[category];            
            slice['percentage'] = this.data[category] / total;
            slice['color'] = this.dyno_colors.get_color(idx);

            this.slices[category] = slice;

            idx = idx + 1;
        }
    }

    /**
     * @param {number} percentage
     * @param {number} radius
     * @return {{'height': number, 'width': number, 'spacing': number}}
     */
    _calc_label_size(percentage, radius){
        let area = Math.PI * Math.pow(radius/2,2) * percentage;
        let ratio = area / (LABEL_HEIGHT * LABEL_WIDTH);
        ratio = (ratio > 0.2) ? 1 : ratio / 0.2; 
        
        let height = LABEL_HEIGHT * ratio;
        let width = LABEL_WIDTH * ratio;
        let spacing = LABEL_SPACING * ratio;
        
        return {'height': height, 'width': width, 'spacing': spacing}
    }

    /**
     * @param {number} percentage
     * @param {number} cx
     * @param {number} cy
     * @param {number} radius
     * @param {{ width: number; height: number; }} size
     */
    _calc_label_position(percentage, cx, cy, radius, size){
        /* Calculate Pos */
        let angle = percentage * Math.PI * 2;
        let tx = radius * Math.sin(angle) + cx - size.width/2;
        let ty = radius * Math.cos(angle) + cy - size.height/2;

        return {'x': tx,'y' : ty};
    }

    /**
     * @return {{'radius': number , 'cx': number, 'cy': number}}
     */
    _get_circle_params(){
        let width = this.dyno_svg.get_width();
        let height = this.dyno_svg.get_height();
        let circle = {'radius':0 , 'cx': 0, 'cy': 0};
        let clean_width = width - (this.graph_margins.left + this.graph_margins.right);
        let clean_height = height - (this.graph_margins.top + this.graph_margins.bottom);
        circle.radius = Math.min(clean_height/2, clean_width/2);

        circle.cx = this.graph_margins.left + (clean_width/2);
        circle.cy = this.graph_margins.top + (clean_height/2);

        return circle;
    }


    _draw(){
        let circle_param = this._get_circle_params();
        
        /**  Loop Through Data **/        
        let percentage_accumulated = 0;
        for (const category in this.slices){            
            let color = this.slices[category]['color'];
            let label_color = get_text_color(color); 
            let percentage_end = percentage_accumulated + this.slices[category]['percentage'];

            let pie_slice = this.dyno_svg.pie_slice(percentage_accumulated, percentage_end, circle_param, color);
            this.dyno_svg.callback_hover(pie_slice, this._callback_hover.bind(this));            
            this.dyno_svg.set_id(pie_slice, category);
            this.slices[category]['pie'] = pie_slice;

            /* Create Label */
            let value = this.dyno_text.display_value_string(this.slices[category]['value']);            
            let lines = {'label_category': category, 'label_value': value};

            let svg_labels = this.dyno_svg.pie_slice_label(lines, percentage_accumulated, percentage_end, circle_param, label_color, FONT_SIZE, LABEL_WIDTH, LABEL_HEIGHT, LABEL_SPACING);            
            this.slices[category] = Object.assign({}, this.slices[category], svg_labels);

            percentage_accumulated = percentage_end;
        }
    }

    _remove(){
        let element_names = ['pie', 'label_category', 'label_value'];
        for (const category in this.slices){
            for (const element_name of element_names){
                let element = this.slices[category][element_name];
                if (typeof element !== 'undefined'){
                    element.remove();
                    delete this.slices[category][element_name];
                }
            }
        }
    }

    _callback_hover(){
        let event = arguments[0].type;
        if (event != 'mouseenter' && event != 'mouseleave'){
            return;
        }

        let category = arguments[0].currentTarget.id;
        let slice = this.slices[category];
        if (typeof slice === 'undefined'){
            console.error(`Got Callback of unknown category = ${category}`);
            return;
        }

        let pie = slice['pie'];
        let label_category = slice['label_category'];

        let label_value = slice['label_value'];

        let pie_fill = (event == 'mouseleave') ? getAttributeStr(pie, MY_FILL) : 'black';
        let label_fill = (event == 'mouseleave') ? getAttributeStr(label_category, MY_FILL) : 'goldenrod';

        pie.setAttribute('fill', pie_fill);
        pie.setAttribute('stroke', pie_fill);
        this.dyno_svg.set_text_attribute(label_category, 'fill', label_fill);
        this.dyno_svg.set_text_attribute(label_value, 'fill', label_fill);
    }

    _resize(){                
        this._parse();           
        this._draw();
    }
}
