import { CheckType } from "../../FasterOrsted/FE/helpers.js";
/************************/
/* DynoColors           */
/* Color Scheme Manager */
/************************/

const scheme_mapping = {
    'maroon'    :  {'start': '5f0937', 'end': 'f381a7'},
    'teal'      :  {'start': '00695f', 'end': '99d5cf'},
    'green'     :  {'start': '357a38', 'end': 'b7deb8'},
    'blue'      :  {'start': '0d47a1', 'end': 'BBDEFB'},
    'cyan'      :  {'start': '006064', 'end': 'B2EBF2'},
    'orange'    :  {'start': 'BF360C', 'end': 'FFCCBC'},
    'purple'    :  {'start': '4A148C', 'end': 'CE93D8'},
    'grey'      :  {'start': '263238', 'end': 'ECEFF1'},
    'red'       :  {'start': 'B71C1C', 'end': 'EF9A9A'},
    'mixed'     :  {'start': 'D32F2F', 'end': '1976D2'},
    'heatmap'   :  [[40, 72, 116], [128, 118, 93], [184, 146,78], [241, 176, 63], [239,155,67], [236,138,70], [230,109,135], [222,66,227], [225,68,139], [238,62,50]],    
}

export function get_schemes(){
    return Object.keys(scheme_mapping);
}


/**
 * @param {number[]} rgb
 * @return {'black'|'white'}
 */
function get_text_color_from_rgb(rgb){
    let yiq = ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

/**
 * @param {string} hsla_text
 * @return {{hue: number, saturation: number, light: number, alpha: number}}
 */
export function convert_hsla_text_to_array(hsla_text){
    let last = 0;
    let values = {'hue':0, 'saturation': 0, 'light':0,'alpha':0};
    let keys = Object.keys(values);

    for (let idx=0;idx<4;idx++){
        let start = hsla_text.indexOf(' ',last) + 1;
        let end = hsla_text.indexOf(' ',start);
        let value_str = hsla_text.substring(start, end);

        switch(idx){
            case 0:
            case 3:
                values[keys[idx]] =Number(value_str);                    
            break;
            case 1:
            case 2:
                values[keys[idx]] = Number(value_str.substring(0, value_str.length-1))/100;                
            break;
        }
        last = end + 1;
    }

    return values;
}

/**
 * @param {string} hsla_color
 */
export function get_text_color(hsla_color){    
    let values = convert_hsla_text_to_array(hsla_color);   

    let rgb = hslToRgb(values['hue'],values['saturation'],values['light']);
    
    return get_text_color_from_rgb(rgb);
}


/**
 * @param {Element} element
 * @return {'black'|'white'}
 */
export function get_text_color_for_element(element){
    let color = getAttributeStr(element, 'fill');
    if (color.includes('hsla')){
        return get_text_color(color);
    }

    if (color[0] == '#'){
        let rgb = convert_rgb_to_decimal(color.substring(1));
        return get_text_color_from_rgb(rgb);
    }

    console.error(`Unknown fill attribute format = ${color}`);
    return 'black';
}

/**
 * @param {{[x: string]: string}} schemes
 * @param {string} category
 * @param {number|{}} alpha 
 * @param {number} count
 * @return {string[]}
 */
export function get_colors(schemes, category, alpha, count){
    let categories = Object.keys(schemes);
    if (!categories.includes(category)){
        console.error(`[Category Error] ${category} not in ${JSON.stringify(categories)}`);
        category = categories[0];
    }

    let selected_scheme = schemes[category];
    let color = scheme_mapping[selected_scheme];    
    if (typeof color === 'undefined'){
        console.error(`[Scheme Error] Invalid Scheme = ${selected_scheme} no in schemes = ${JSON.stringify(Object.keys(scheme_mapping))}`);
        color = scheme_mapping['mixed'];
    }

    let my_alpha = (typeof alpha === 'number') ? alpha : alpha[category];
    my_alpha = (typeof my_alpha === 'undefined') ? 1.0 : my_alpha;

    if (CheckType(color, 'dict') == true){    
        let hsl_start = convert_to_hsl(color.start);
        let hsl_end   = convert_to_hsl(color.end);
    
        let colors = generate_colors(hsl_start, hsl_end, my_alpha, count);
        return colors;
    }

    /** Colors already in RGB Format **/
    let colors = [];
    for (let element of color){
        let hsla = RGBToHSL(element[0], element[1], element[2]);
        let svg_text = `hsla( ${hsla[0].toFixed(1)} , ${hsla[1].toFixed(1)}% , ${hsla[2].toFixed(1)}% , ${my_alpha.toFixed(2)} )`;  
        colors.push(svg_text);
    }

    return colors.reverse();
}

/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 */
function hslToRgb(h, s, l) {
    let r, g, b;
  
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hueToRgb(p, q, h + 1/3);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1/3);
    }
  
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

/**
 * @param {number} p
 * @param {number} q
 * @param {number} t
 */
function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}
/**
 * @param {string} rgb_hex
 * @return {number[]}
 */
function convert_rgb_to_decimal(rgb_hex){
    let r = Number(`0x${rgb_hex.substring(0,2)}`);
    let g = Number(`0x${rgb_hex.substring(2,4)}`);
    let b = Number(`0x${rgb_hex.substring(4,6)}`);

    return [r,g,b]
}

/**
 * @param {string} rgb
 */
function convert_to_hsl(rgb){
    let [r,g,b] = convert_rgb_to_decimal(rgb);    
    let hsl = RGBToHSL(r, g, b);

    return hsl;
}

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @return {number[]}
 */
function RGBToHSL(r,g,b) {
    // Make r, g, and b fractions of 1
    r /= 255;
    g /= 255;
    b /= 255;
  
    // Find greatest and smallest channel values
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
  
    // Calculate hue
    // No difference
    if (delta === 0)
      h = 0;
    // Red is max
    else if (cmax === r)
      h = ((g - b) / delta) % 6;
    // Green is max
    else if (cmax === g)
      h = (b - r) / delta + 2;
    // Blue is max
    else
      h = (r - g) / delta + 4;
  
    h = Math.round(h * 60);
      
    // Make negative hues positive behind 360°
    if (h < 0)
        h += 360;
  
    // Calculate lightness
    l = (cmax + cmin) / 2;
  
    // Calculate saturation
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
      
    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
  
    return [h, s, l];
  }

/**
 * @param {number[]} hsla_start
 * @param {number[]} hsla_end
 * @param {number} alpha
 * @param {number} count
 * @return {string[]}
 */
function generate_colors(hsla_start, hsla_end, alpha, count){
    let steps=[];
    for (let idx=0;idx<hsla_start.length;idx++){
        let step = (hsla_end[idx] - hsla_start[idx]) / (count-1);
        steps.push(step);
    }

    let hslas = [];
    for (let idx=0;idx<count;idx++){
        let hsla = [];
        for (let clr=0;clr<hsla_start.length;clr++){
            let value = hsla_start[clr] + (steps[clr] * idx);
            hsla.push(value);
        }
        let svg_text = `hsla( ${hsla[0].toFixed(1)} , ${hsla[1].toFixed(1)}% , ${hsla[2].toFixed(1)}% , ${alpha.toFixed(2)} )`;        
        hslas.push(svg_text);        
    }

    return hslas;

}
/************************/
/* DynoText             */
/* Text Format Manager  */
/************************/

const PREFIX = {'usd' : '$', 'ringgit' : 'RM', 'gbp': '£'};

export class DynoText{
    /**
     *  @param {'number'|'string'|'ringgit'|'usd'|'yen'|'gbp'|'percentage'} label_type
     */
    constructor(label_type){
        this.label_type = label_type;
    }

    /**
     *
     * @param {string|number} value
     * @return {string}
     */

    display_value_string(value){
        if (typeof value === 'string'){
            return value;
        }

        if (this.label_type == 'percentage'){
            let decimal = (value < 10) ? 2 : (value < 100) ? 1 : 0;
            return `${value.toFixed(decimal)}%`
        }

        if (this.label_type == 'yen'){
            return `¥${value.toFixed(0)}`;
        }

        
        if (this.label_type == 'ringgit' || this.label_type == 'usd' || this.label_type == 'gbp'){
            let decimal = (value < 1000) ? 2 : 0;
            return `${PREFIX[this.label_type]}${value.toFixed(decimal)}`;
        }    
        return `${value}`;
    }
}

/*******************/
/* Helper Functions */
/*******************/

/**
 * @param {Element} element
 * @param {string} attribute
 * @return {number}
 */
export function getAttribute(element, attribute){
    let value = element.getAttribute(attribute);
    if (value == null){
        console.error(`Failed to attribute = ${attribute} for element = ${element}`);
        return 0;
    }

    return parseInt(value);
}

/**
 * @param {Element} element
 * @param {string} attribute
 * @return {string}
 */
export function getAttributeStr(element, attribute){
    let value = element.getAttribute(attribute);
    if (value == null){
        console.error(`Failed to get attribte =${attribute} for element ${element}`);
        return '';
    }

    return value;
}

/**
 * @param {Element[]} element_list
 */
export function removeElement(element_list){    
    while(element_list.length>0){
        let element = element_list.pop();
        if (typeof element === 'undefined'){
            return;
        }
        
        element.remove();
    }
}
