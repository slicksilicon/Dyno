import { MY_FILL, DynoSvg } from "./DynoSvg.js";
import { DynoConfig } from "./DynoConfig.js";
import { get_colors, getAttributeStr,  get_text_color, DynoText} from "./DynoTools.js";

const LABEL_HEIGHT = 50;
const LABEL_WIDTH = 200;
const LABEL_SPACING = 5;
const FONT_SIZE = 24;

export class DynoPie{
    
    /**
     * @param {string} id
     * @param {{[x:string] : number}} data
     * @param {DynoConfig} config
     */
    constructor(id, data, config){
        this.dyno_svg = new DynoSvg(id);
        this.data = data;
        this.config = config;

        let categories = Object.keys(data);
        this.colors = get_colors(config.color_schemes, 'pie', config.color_alpha, categories.length);        
        
        this.slices = this._parse();   
        
        this._draw();

        this.dyno_svg.add_resize_callback(this._resize.bind(this), true);
    }

    _parse(){
        let slices = {};
        let total = Object.values(this.data).reduce((a,b) => a+b, 0);
        let idx = 0;
        for (let category in this.data){
            let slice = {}
            slice['value'] = this.data[category];            
            slice['percentage'] = this.data[category] / total;
            slice['color'] = this.colors[idx];

            slices[category] = slice;

            idx = idx + 1;
        }

        return slices;
    }

    /**
     * @param {number} percentage
     * @param {number} radius
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


    _draw(){
        let circle_param = this.config.get_circle_params(this.dyno_svg.get_height(), this.dyno_svg.get_width());

        
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
            
            let value = new DynoText(this.config.label_type).display_value_string(this.slices[category]['value']);
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
        this.slices = this._parse();           
        this._draw();
    }
}
