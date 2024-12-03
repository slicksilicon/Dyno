import { getAttribute } from './DynoTools.js';
import { get_text_color_for_element } from './DynoColors.js';
import { DivCtrl, getSVGNS, GetComputedHeight, GetComputedWidth } from '../../FasterOrsted/FE/helpers.js';

const ATTRIB_RESIZE_TYPE = 'resize_type';
const RESIZE_TYPE_FIXED = 'fixed';
const RESIZE_TYPE_FOLLOW = 'follow';

let DEBUG_TEXT = false;

export const MY_FILL = 'my_fill';

const SVG_URI = getSVGNS();

const PROPOTIONAL_ATTRIBUTES = {
    'circle' :  {'width' : ['cx'], 'height': ['cy']}, 
    'line' :    {'width' : ['x1', 'x2'], 'height' : ['y1', 'y2']},
    'rect' :    {'width' : ['x', 'width'], 'height' : ['y', 'height']},    'text' :    {'width' : ['x', 'width'], 'height' :['y', 'height']},
    'svg'  :    {'width' : ['width'], 'height' : ['height']}
};

export class DynoSvg{
    /**
     * @param {string|HTMLElement} parent
     */
    constructor(parent){
        this.parent = DivCtrl(parent, 'div');
        this.parent_size = this._update_size();
        this.parent_new_size = this._update_size();
        this.remove_elements_flg = false;
                
        this.parent_svg = this.svg(100, 100, 0, 0, true);
        this._set_resize_type_follow(this.parent_svg);        
        this.parent.appendChild(this.parent_svg); 

        this.elements = [];
        this.callbacks = [];
        new ResizeObserver(this._div_resized.bind(this)).observe(this.parent);
    }

    /*****************************/
    /* Reactive Design Operation */
    /*****************************/
    _update_size(){
        return {'height': GetComputedHeight(this.parent), 'width': GetComputedWidth(this.parent)};
    }

    _div_resized(){ 
        let previous_size = this.parent_size;

        this.parent_new_size = this._update_size();
        this._recalculate_follow(this.parent_svg);
        this.parent_size = this._update_size();

        if (previous_size.height == this.parent_new_size.height && previous_size.width == this.parent_size.width){            
            return;
        }
        
        if (this.remove_elements_flg == true){
            this.remove_elements();
        }
        
        for (let callback of this.callbacks){
            callback();
        }
    }

    /**
     * @param {Element} element
     * @param {string} attrib
     * @param {string} direction
     */
    _calc_proportional(element, attrib, direction){
        let original = element.getAttribute(attrib);
        if (original == null){
            console.error(`Invalid attrib = ${attrib} for element = ${element.tagName}`);
            return;
        }

       let calculated = parseFloat(original) * (this.parent_new_size[direction] / this.parent_size[direction]);
       element.setAttribute(attrib, `${calculated}`);    
    }

    /**
     * @param {Element} element
     */
    _recalculate_follow_element(element){
        if (element.getAttribute(ATTRIB_RESIZE_TYPE) == null){
            return;
        }

        if (element.getAttribute(ATTRIB_RESIZE_TYPE) != RESIZE_TYPE_FOLLOW){
            return;
        }

        if (!(element.tagName in PROPOTIONAL_ATTRIBUTES)){
            console.error(`Unsupported Propotional Element = ${element.tagName}`);
            return;
        }

        for (let direction of ['width', 'height']){
            for (let attrib of PROPOTIONAL_ATTRIBUTES[element.tagName][direction]){
                this._calc_proportional(element, attrib, direction);
            }
        }

        if (element.getAttribute('viewBox') == null){
            return;
        }

        this.svg_view_size(element, -1, -1, false);
    } 

    /**
     * @param {Element} top_element
     */
    _recalculate_follow(top_element){
        this._recalculate_follow_element(top_element);        
        for (let element of top_element.children){
            this._recalculate_follow(element);
        }
    }

    /********************/
    /* Helper Functions */
    /********************/

    /**
     * @param {string} name
     */
    _create_id(name){
        return `${name}_id`;
    }

    /**
     * @param {Element} element
     */
    _set_resize_type_follow(element){
        element.setAttribute(ATTRIB_RESIZE_TYPE, RESIZE_TYPE_FOLLOW);
    }

    /**
     * @param {string} name
     * @return {Element}
     */    
    _get_element_by_name(name){
        let my_id = this._create_id(name);
        let element = document.getElementById(name);
        if (element == null){
            console.error(`Failed to find element with name = ${name}`);
            return document.createElementNS(SVG_URI, 'svg');
        }

        return element;
    }

    /**
     * @param {Element} element
     * @param {string} name
     */
    _add_id(element, name){
        element.id = this._create_id(name);
        return element;
    }

    /**
     * @param {number} percent
     */
    _convert_percentage_width(percent){
        return (percent / 100) * this.parent_size.width;
    }

    /**
     * @param {number} percent
     */
    _convert_percentage_height(percent){
        return (percent / 100 ) * this.parent_size.height;
    }

    /**
     * @param {Element} element
     * @param {string} attrib
     */
    _get_float_attribute(element, attrib){
        let value = element.getAttribute(attrib);
        if (value == null){
            return 0;
        }

        return parseFloat(value);
    }

    /**
     * @param {string|number[]} color_setting
     * @return {string}
     */
    _convert_to_hsla(color_setting){
        if (typeof color_setting === 'string'){
            return color_setting;
        }

        if (color_setting.length == 3){
            color_setting.push(1.0);
        }

        let hsl_string = `hsla(${color_setting[0]}, ${color_setting[1]}%, ${color_setting[2]}%, ${color_setting[3]})`;

        return hsl_string;
    }

    /******************/
    /* External APIs  */
    /******************/

    /**
     * @param {CallableFunction} callback
     * @param {boolean} auto_remove_elements
     */
    add_resize_callback(callback, auto_remove_elements){
        this.callbacks.push(callback);
        this.remove_elements_flg = auto_remove_elements;
    }

    get_width(){
        //@ts-ignore
        return GetComputedWidth(this.parent)
    }

    get_height(){
        //@ts-ignore
        return GetComputedHeight(this.parent)
    }

    /*******************/
    /* Remove Elements */
    /*******************/

    remove_elements(){
        while(this.elements.length>0){
            let element = this.elements.pop();
            if (typeof element === 'undefined'){
                return;
            }
            
            element.remove();
        }
    }

    /*******************/
    /* Create Elements */
    /*******************/

    /**
     * @param {number} width
     * @param {number} height
     * @param {number} x
     * @param {number} y
     * @param {boolean} percentage
     */
    svg(width, height, x, y, percentage){
        let svg = document.createElementNS(SVG_URI, 'svg');

        if (percentage == true){
            width = this._convert_percentage_width(width);
            height = this._convert_percentage_height(height);
            x = this._convert_percentage_width(x);
            y = this._convert_percentage_height(y);
        }

        svg.setAttribute('width', `${width}`);
        svg.setAttribute('height', `${height}`);
        svg.setAttribute('x', `${x}`);
        svg.setAttribute('y', `${y}`);

        svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
        
        return svg;
    }

    /**
     * @param {Element} svg
     * @param {number} width
     * @param {number} height
     * @param {boolean} percentage
     */
    svg_view_size(svg, width, height, percentage){
        let viewBox = svg.getAttribute('viewBox');
        if (viewBox == null){
            console.error('Invalid svg ... has not viewBox');
            return svg;
        }

        let values = viewBox.split(' ');
        if (values.length != 4){
            console.error(`viewBox length != 4 it is ${values.length}`);
            return svg;
        }

        if (percentage == true){
            width = this._convert_percentage_width(width);
            height = this._convert_percentage_height(height);
        }

        if (height == -1){
            height = this._get_float_attribute(svg, 'height');
        }

        if (width == -1){
            width = this._get_float_attribute(svg, 'width');
        }

        svg.setAttribute('viewBox', `${values[0]} ${values[1]} ${width} ${height}`);
        return svg;
    }

   

    /**     
     * @param {number} pos_x
     * @param {number} pos_y
     * @param {number} width
     * @param {number} height
     * @param {string|number[]} fill
     * @param {string|number[]} stroke
     * @param {number} stroke_width
     * @param {boolean} percentage
     */

    rectangle(pos_x, pos_y, width, height, fill, stroke, stroke_width, percentage){
        let rect = document.createElementNS(SVG_URI, 'rect');   
        
        if (percentage == true){
            pos_x = this._convert_percentage_width(pos_x);
            pos_y = this._convert_percentage_height(pos_y);
            width = this._convert_percentage_width(width);
            height = this._convert_percentage_height(height);
        }

        /* convert colors */
        fill = this._convert_to_hsla(fill);
        stroke = this._convert_to_hsla(stroke);
        
        rect.setAttribute('x', `${pos_x}`);
        rect.setAttribute('y', `${pos_y}`);
        rect.setAttribute('width', `${width}`);
        rect.setAttribute('height', `${height}`);
        rect.setAttribute('fill', fill);
        rect.setAttribute(MY_FILL, fill);
        rect.setAttribute('stroke', stroke);
        rect.setAttribute('stroke-width', `${stroke_width}`);

        this.parent_svg.appendChild(rect);
        this.elements.push(rect);

        return rect;
    }

    /**     
     * @param {number} x
     * @param {number} y
     * @param {number} length
     * @param {number} thickness
     * @param {string} color
     * @param {boolean} percentage
     */
    line_horizontal(x,y,length, thickness, color, percentage){
        return this.line(x, y, x+length, y, thickness, color, percentage);
    }

    /**      
     * @param {number} x
     * @param {number} y
     * @param {number} length
     * @param {number} thickness
     * @param {string} color
     * @param {boolean} percentage
     */
    line_vertical(x,y,length, thickness, color, percentage){
        return this.line(x, y, x, y+length, thickness, color, percentage);
    }

    /**     
     * @param {Element} line
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {boolean} percentage
     */
    update_line(line, x1, y1, x2, y2, percentage){
        if (percentage == true){
            x1 = this._convert_percentage_width(x1);
            x2 = this._convert_percentage_width(x2);
            y1 = this._convert_percentage_height(y1);
            y2 = this._convert_percentage_height(y2);
        }


        line.setAttribute('x1', `${x1}`);
        line.setAttribute('y1', `${y1}`);
        line.setAttribute('x2', `${x2}`);
        line.setAttribute('y2', `${y2}`);

        return line;
    }

    /**     
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} thickness
     * @param {string} fill
     * @param {boolean} percentage
     */
    line(x1, y1, x2, y2, thickness, fill, percentage){
        let line = document.createElementNS(SVG_URI, 'line');   
        line = this.update_line(line, x1, y1, x2, y2, percentage);     

        line.setAttribute('stroke-width', `${thickness}`);
        line.setAttribute('stroke', fill);
        line.setAttribute(MY_FILL, fill);

        this.parent_svg.appendChild(line);
        this.elements.push(line);
        
        return line;
    }

    /**     
     * @param {string} sentence
     * @param {number} pos_x This is the start of the text box
     * @param {number} pos_y This is the middle of the text box
     * @param {number} font_size
     * @param {number} width
     * @param {number} height
     * @param {string} color
     * @param {'left'|'right'|'center'} horizontal
     * @param {'top'|'bottom'|'center'} vertical
     */
    text(sentence, pos_x, pos_y, font_size, width, height, color, horizontal, vertical){
        /** Create the SVG Text Box **/      
        let text = document.createElementNS(SVG_URI, 'text');
        text.setAttribute('x', `${pos_x}`);
        text.setAttribute('y', `${pos_y}`);           
        text.setAttribute('font-size', `${font_size}`);
        text.setAttribute('fill', color);
        text.setAttribute(MY_FILL, color);        
        text.innerHTML = sentence;

        /** Create an SVG Wrapper Element for scaling and positioning **/ 
        let text_svg = document.createElementNS(SVG_URI, 'svg');
        text_svg.appendChild(text);
        this.parent_svg.appendChild(text_svg);

        /** Set the Scaling */
        // @ts-ignore
        let bBox = text.getBBox();
        text_svg.setAttribute('width', `${width}`);
        text_svg.setAttribute('height', `${height}`);
        text_svg.setAttribute('viewBox', `${bBox.x} ${bBox.y} ${bBox.width} ${bBox.height}`);
        text_svg.setAttribute(MY_FILL, color);

        
        /* Set the Correct Position */
        let rendered = text.getBoundingClientRect();        
        switch(vertical){
            case 'top':
                pos_y = pos_y + (rendered.height/2) - height;
                break;     
            case 'bottom':                
                pos_y = pos_y - rendered.height + (rendered.height/2);
                break;
            case 'center':
                pos_y = pos_y - (height/2);
                break;
        }

        switch(horizontal){
            case 'left':
                pos_x = pos_x - (width - rendered.width)/2;
                break;
            case 'right':
                pos_x = pos_x + (width - rendered.width)/2;
                break;
            case 'center':
                break;
        }

        text_svg.setAttribute('x', `${pos_x}`);
        text_svg.setAttribute('y', `${pos_y}`);

        if (DEBUG_TEXT == true){
            this.rectangle(pos_x, pos_y, width, height, 'transparent', 'black', 1, false);
        }
        

        this.elements.push(text_svg);

        return text_svg;
    }

    /**
     * @param {string[]|string} sentences
     * @param {Element} element
     * @param {{'height': number, 'width': number}} max_size
     * @param {{'left': number, 'right': number, 'top': number, 'bottom': number, line_spacing:number}} margins
     * @param {'top'|'bottom'|'center'} vertical
     * @param {'left'|'right'|'center'} horizontal
     * @param {string|null} color
     * @return {Element[]}
     */
    text_in_element(sentences, element, max_size, margins, vertical, horizontal, color){
        if (typeof sentences === 'string'){
            sentences = [sentences];
        }

        /* List of Elements Created */
        let elements = [];

        /* Element Parameters */
        let ex = getAttribute(element, 'x');
        let ey = getAttribute(element, 'y');
        let ewidth = getAttribute(element, 'width');
        let eheight = getAttribute(element, 'height');

        /* Text Color */
        color = (color == null) ? get_text_color_for_element(element) : color;

        /* Total Text Size - height is for all sentences combined */
        let width = Math.min(max_size.width, ewidth - (margins.left + margins.right));
        let height = Math.min(max_size.height, eheight - (margins.bottom + margins.top));

        let y = ey;
        switch(vertical){
            case 'bottom':
                y += (eheight - height - margins.bottom);
                break;
            case 'top':
                y += margins.top;
                break;
            case 'center':
                y += (eheight - (margins.top + margins.bottom))/2 - (height / 2) + margins.top;
                break; 
        }

        let x= ex;
        switch(horizontal){
            case 'left':
                x += margins.left;
                break;
            case 'right':
                x += ewidth - margins.right - width;
                break;
            case 'center':
                x += (ewidth - (margins.left+margins.right))/2 - (width / 2) + margins.left;
                break;
        }
        
        let sentence_height = (height/sentences.length) - margins.line_spacing;
        for (const sentence of sentences){            
            let element = this.text(sentence, x, y+(sentence_height/2), 24, width, sentence_height, color, 'center', 'center');
            y += sentence_height + margins.line_spacing;

            elements.push(element);
        }

        return elements;
    }

    /**
     * The size and position is related to the view port size     
     * @param {{cx : number, cy: number, radius:number}} circle_param
     * @param {string|number[]} fill
     * @param {string|number[]} stroke
     * @param {number} stroke_width
     * @param {boolean} percentage
     */
    circle(circle_param, fill, stroke, stroke_width, percentage){
        let circle = document.createElementNS(SVG_URI, 'circle');

        let cx = (percentage == true) ? this._convert_percentage_width(circle_param.cx) : circle_param.cx;
        let cy = (percentage == true) ? this._convert_percentage_height(circle_param.cy) : circle_param.cy; 

        /* convert colors */
        fill = this._convert_to_hsla(fill);
        stroke = this._convert_to_hsla(stroke);

        circle.setAttribute('cx', `${cx}`);
        circle.setAttribute('cy', `${cy}`);
        circle.setAttribute('r', `${circle_param.radius}`);
        circle.setAttribute('fill', fill);
        circle.setAttribute(MY_FILL, fill)
        circle.setAttribute('stroke', stroke);        
        circle.setAttribute('stroke-width', `${stroke_width}`);

        this.parent_svg.appendChild(circle);
        this.elements.push(circle);
        
        return circle;

    }

    /**
     * @param {number} percentage
     * @param {{cx : number, cy: number, radius:number}} circle_param
     */
    _calc_circumferance_pos(percentage, circle_param){
        let x = Math.cos(2 * Math.PI * percentage) * circle_param.radius + circle_param.cx;
        let y = Math.sin(2 * Math.PI * percentage) * circle_param.radius + circle_param.cy;

        return {'cx': x, 'cy': y, 'radius': circle_param.radius};
    }

    /**
     * @param {number} percentage
     * @param {{ cx: number; cy: number; radius:number}} circle_param
     * @param {number} width
     * @param {number} height
     * @param {number} spacing
     */
    _calc_label_size(percentage, circle_param, width, height, spacing){
        let area = Math.PI * Math.pow(circle_param.radius/2,2) * percentage;
        let ratio = area / (height * width);
        ratio = (ratio > 0.2) ? 1 : ratio / 0.2; 
        
        height = height * ratio;
        width = width * ratio;
        spacing = spacing * ratio;
        
        return {'height': height, 'width': width, 'spacing': spacing}
    }


    /**
     * @param {number} percentage_start
     * @param {number} percentage_end
     * @param {{ cx: number; cy: number; radius:number}} circle_param     
     * @param {string} color
     */
    pie_slice(percentage_start, percentage_end, circle_param, color){
        let move = this._calc_circumferance_pos(percentage_start, circle_param);
        let arc_end = this._calc_circumferance_pos(percentage_end, circle_param);
        let large_arc_flag = ((percentage_end - percentage_start) > .5) ? 1 : 0;

        let instruction = `M ${move.cx} ${move.cy} A ${circle_param.radius} ${circle_param.radius} 0 ${large_arc_flag} 1 ${arc_end.cx} ${arc_end.cy} L ${circle_param.cx} ${circle_param.cy}`;

        let path = document.createElementNS(SVG_URI, 'path');
        path.setAttribute('d', instruction);
        path.setAttribute('stroke', color);
        path.setAttribute('fill', color);
        path.setAttribute(MY_FILL, color);

        this.parent_svg.appendChild(path);
        this.elements.push(path);

        return path;
    
    }

    /**
     * @param {{[x:string]: string}} lines
     * @param {number} percentage_start
     * @param {number} percentage_end
     * @param {{cx: number; cy: number; radius: number}} circle_param     
     * @param {string} color
     * @param {number} font_size
     * @param {number} width
     * @param {number} height
     * @param {number} spacing
     */
    pie_slice_label(lines, percentage_start, percentage_end, circle_param, color, font_size, width, height, spacing){
        let texts = {};
        let center_line = percentage_start + (percentage_end - percentage_start)/2;
        let label_param = Object.assign({}, circle_param);
        label_param.radius  = circle_param.radius * 0.6;
        let text_pos = this._calc_circumferance_pos(center_line, label_param);
        let text_size = this._calc_label_size(percentage_end - percentage_start, label_param, width, height, spacing);

        let line_height = text_size.height / Object.keys(lines).length;        
        text_pos.cx = text_pos.cx - text_size.width / 2;
        text_pos.cy = text_pos.cy - text_size.height / 2;
        
        for (let line in lines){
            let text = this.text(lines[line], text_pos.cx, text_pos.cy, font_size, text_size.width, line_height, color, 'center', 'center');            
            texts[line] = text;
            text_pos.cy = text_pos.cy + line_height;
        }

        return texts;
    }

    /**
     * @param {string} instruction
     * @param {number} stroke_width
     * @param {string} stroke_color
     * @param {string} fill_color
     */
    path(instruction, stroke_width, stroke_color, fill_color){
        let path = document.createElementNS(SVG_URI, 'path');
        path.setAttribute('d', instruction);
        path.setAttribute('stroke-width', `${stroke_width}`);
        path.setAttribute('stroke', stroke_color);
        path.setAttribute('fill', fill_color);
        path.setAttribute('my_fill', fill_color);

        this.parent_svg.appendChild(path);
        this.elements.push(path);

        return path;
    }

    /**
     * @param {{offset: number;color: string;}[]} stops offset value 0..1
     * @param {Element} parent
     */
    _create_stops(stops, parent){        
        for (let stop of stops){    
            let stop_element = document.createElementNS(SVG_URI, 'stop');
            stop_element.setAttribute('stop-color', stop.color);
            stop_element.setAttribute('offset', `${stop.offset*100}%`);

            this.elements.push(stop_element);
            parent.appendChild(stop_element);
        }        
    }

    /**
     * @param {string} id
     * @param {{offset: number, color: string}[]} stops offset value 0..1
     */
    gradient_radial(id, stops){
        let radial_element = document.createElementNS(SVG_URI, 'radialGradient');
        radial_element.id = id;
        this._create_stops(stops, radial_element);

        this.elements.push(radial_element);
        this.parent_svg.appendChild(radial_element);
    }

    /**
     * @param {string} id
     * @param {{offset: number, color: string}[]} stops offset value 0..1
     */
    gradient_linear(id, stops){
        let linear_gradient = document.createElementNS(SVG_URI, 'linearGradient');
        linear_gradient.id = id;
        this._create_stops(stops, linear_gradient);

        this.elements.push(linear_gradient);
        this.parent_svg.appendChild(linear_gradient);        
    }

    /****************************/
    /* Setup Element Attributes */
    /****************************/

    /**
     * @param {Element} element
     * @param {string} id
     */
    set_id(element, id){
        element.id = id;
    }

    /**
     * @param {Element} element
     * @param {EventListener} callback
     */
    callback_hover(element, callback){
        element.addEventListener('mouseenter', callback); 
        element.addEventListener('mouseleave', callback); 
    }

    /**
     * @param {Element} element
     * @param {EventListener} callback
     */
    callback_click(element, callback){
        element.addEventListener('click', callback)
    }

    /**
     * @param {Element} svg_element
     * @param {string} attribute
     * @param {string} value
     */
    set_text_attribute(svg_element, attribute, value){
        let text_element = svg_element.getElementsByTagName('text');
        if (text_element.length == 0){
            console.error(`No Text Element in provided element ${svg_element.id}`);
            return;
        }

        text_element[0].setAttribute(attribute, value);        
    }
}