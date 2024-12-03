import { getAttributeStr } from "./DynoTools.js";

/************************/
/* DynoColors           */
/* Color Scheme Manager */
/************************/

const SCHEME_MAPPING = {
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

const FIXED_SCHEMES = ['heatmap'];
const DEFAULT_SCHEME = 'teal';
const DEFAULT_COUNT = 10;
const DEFAULT_ALPHA = 1.0;

/**
 * Checks if scheme exist
 * @param {string} scheme_name
 * @returns {boolean}
 */
export function check_scheme(scheme_name){
    let schemes = Object.keys(SCHEME_MAPPING);
    if (schemes.includes(scheme_name) == true){
        return true;
    }

    console.error(`Invalid Scheme Name = ${scheme_name}`);
    return false;
}

/**
 * Creates a DynoColors Instance for every group which are the keys in groups variable.
 * @param {{[x:string]: string}} user_schemes fixed schemes group_name : scheme_name
 * @param {{[x:string] : number} | {}} groups {Group Name : Number of Colors Needed}
 * @param {number} alpha Fixed Alpha Value for all schemes  
 * @returns {{ [x: string] : DynoColors}  | {}}
 */
export function factory_multiple_schemes(user_schemes, groups, alpha){
        let schemes = Object.keys(SCHEME_MAPPING);
        let group_names = Object.keys(groups);
        let group_idx = 0;
        let provided_schemes = Object.keys(user_schemes);

        let dyno_colors = {};
        
        for (let scheme of schemes){
            /**@type string **/
            let selected_group = '';
            let group_name = group_names[group_idx];

            if (group_idx >= group_names.length){
                break;
            }

            if (Object.keys(dyno_colors).includes(group_name)){
                continue;
            }

            if (provided_schemes.includes(scheme)){
                selected_group = user_schemes[scheme];                
            } else {
                selected_group = group_name;
            }
            
    
            dyno_colors[selected_group] = new DynoColors();
            dyno_colors[selected_group].setup_colors(scheme, groups[selected_group], alpha);            
            group_idx = group_idx + 1;
        }

        if (group_idx != group_names.length){
            console.error(`Insufficient Number of groups for ==> ${group_names.length} got only ${schemes.length}`);
        }

        return dyno_colors;
    }


export class DynoColors{
    constructor(){
        this.scheme = DEFAULT_SCHEME;        
        this.count  = DEFAULT_COUNT;
        this.alpha  = DEFAULT_ALPHA;
        this.colors = [];        

        /**@type {{'min': number|null, 'max': number|null}} */
        this.data_range_user = {'min': null, 'max': null};

        /**@type {{'min': number, 'max': number}} */
        this.data_range_actual = {'min': 0, 'max': 0};

        /**@type {{'min': number, 'max': number}} */
        this.data_range_use = {'min': 0, 'max': 0};
    }


    /**
     * @param {string} scheme
     * @param {number} count
     * @param {number} alpha
     * @return {boolean}
     */
    setup_colors(scheme,count, alpha){
        if (this._check_setup(scheme, count, alpha) == false){
            return false;
        }

        this.scheme = scheme;
        this.count  = count;
        this.alpha  = alpha;

        this.colors.length = 0;

        return true;
    }

    /**
     * @param {string} scheme
     * @return {boolean}
     */
    set_scheme(scheme){
        if (this._check_scheme(scheme) == false){
            return false;
        }

        this.scheme = scheme;
        this.colors.length = 0;

        return true;
    }

    /**
     * @param {number} alpha
     * @return {boolean}
     */
    set_alpha(alpha){
        if (this._check_alpha(alpha) == false){
            return false;
        }

        this.alpha = alpha;
        this.colors.length = 0;

        return true;
    }

    /**
     * @param {string} scheme
     * @param {number} alpha
     * @return {boolean}
     */
    set_scheme_alpha(scheme, alpha){
        if (this._check_scheme(scheme) == false || this._check_alpha(alpha) == false){
            return false;
        }

        this.scheme = scheme;
        this.alpha  = alpha;
        this.colors.length = 0;

        return true;
    }

    /**
     * @param {number} count
     * @return {boolean}
     */
    set_count(count){
        if(this._check_count(count, this.scheme) == false){
            return false;
        }

        this.count = count;
        this.colors.length = 0;

        return true;
    }

    _calc_data_range_use(){
        this.data_range_use.max = (this.data_range_user.max == null) ? this.data_range_actual.max : this.data_range_user.max;
        this.data_range_use.min = (this.data_range_user.min == null) ? this.data_range_actual.min : this.data_range_user.min;

        if (this.data_range_use.max < this.data_range_actual.max){
            console.warn(`Warning Max Data Range User [${this.data_range_user.max}] < Actual ${this.data_range_actual.max}.`);
            this.data_range_use.max = this.data_range_actual.max;
        }

        if (this.data_range_use.min > this.data_range_actual.min){
            console.warn(`Warning Min Data Range User [${this.data_range_user.min}] > Actual ${this.data_range_actual.min}.`);
            this.data_range_use.min = this.data_range_actual.min;
        }
    }

    /**
     * @param {number} min
     * @param {number} max     
     */
    set_data_range_user(min, max){
        if (min >= max){
            console.error(`Max [${max}] cannot >= Min [${min}].`);
            return;
        }

        this.data_range_user.min = min;
        this.data_range_user.max = max;
        
        this._calc_data_range_use();
    }

    /**
     * @param {number} min
     * @param {number} max     
     */
    set_data_range_actual(min, max){
        if (min >= max){
            console.error(`Max [${max}] cannot >= Min [${min}].`);
            return;
        }

        this.data_range_actual.min = min;
        this.data_range_actual.max = max;

        this._calc_data_range_use();
    }

    get_schemes(){
        return Object.keys(SCHEME_MAPPING);
    }

    /**
     * @param {number} value
     */
    get_color_for_value(value){
        if (this.colors.length == 0){
            this._generate_colors();
        }

        if (this.data_range_actual.max == null || this.data_range_actual.min == null){
            console.error(`Data Range not set. Please set via (set_range). Min = ${this.data_range_user.min} Max = ${this.data_range_actual.max}`);
            return this._hsla_error();
        }

        let percentage = (value - this.data_range_actual.min) / (this.data_range_actual.max - this.data_range_actual.min);
        
        if (percentage > 1){
            console.warn(`Value [${value}] is larger than maximum ${this.data_range_actual.max}`); 
            percentage = 1.0;           
        }

        let color_idx = Math.floor(percentage * this.count);
        if (color_idx >= this.count){
            color_idx = this.count-1;
        }
        
        return this.colors[color_idx];
    }

    /**
     * @param {number} offset
     * @return {string}
     */
    get_color(offset){
        if (this.colors.length == 0){
            this._generate_colors();
        }

        if (offset >= this.count){
            console.error(`Count Set was ${this.count} which is smaller than the requested offset of ${offset}`);
            return this._hsla_error()
        }

        if (offset >= this.colors.length){
            console.error(`Error in Generating Colors. Colors.length ${this.colors.length} != ${this.count}`);
            return this._hsla_error();
        }

        return this.colors[offset];
    }

    /**
     * @param {string} scheme
     * @return {boolean}
     */
    _check_scheme(scheme){
        let schemes = Object.keys(SCHEME_MAPPING);
        if (schemes.includes(scheme) == false){
            console.error(`invalid scheme = ${scheme}. Valids = ${schemes}`);
            return false;
        }

        return true;
    }

    /**
     * @param {number} alpha
     * @return {boolean}
     */
    _check_alpha(alpha){
        if (alpha > 1.0 || alpha < 0.0){
            console.error(`Alpha must be between 0.0 and 1.0 and not ${alpha}`);
            return false;
        }

        return true;
    }

    /**
     * @param {number} count
     * @param {string} scheme
     */
    _check_count(count, scheme){
        if (FIXED_SCHEMES.includes(scheme) && count > SCHEME_MAPPING[scheme].length){
            console.error(`Scheme = ${scheme} has a max of ${SCHEME_MAPPING[scheme].length} and cannot accomadate = ${count}`);
            return false;
        }

        if (count <= 0){
            console.error(`Count must be a positive number and not ${count}`);
            return false;
        }

        return true;
    }

    /**
     * @param {string} scheme
     * @param {number} count
     * @param {number} alpha
     * @return {boolean}
     */
    _check_setup(scheme, count, alpha){
        if (this._check_scheme(scheme) == false || this._check_alpha(alpha) == false || this._check_count(count, scheme) == false){
            return false;
        }

        return true;
    }

    _hsla_error(){
        return `hsla( 128 , 50% , 50% , 0.5 )`;        
    }

    _generate_colors(){
        let selected_colors = SCHEME_MAPPING[this.scheme];

        /** Clear Previous Colors */
        this.colors.length = 0;

        

        /** Check if Fixed Scheme */
        if (FIXED_SCHEMES.includes(this.scheme)){

            /** Colors already in RGB Format **/            
            for (let element of selected_colors){
                let hsla = this._RGBToHSL(element[0], element[1], element[2]);
                let svg_text = `hsla( ${hsla[0].toFixed(1)} , ${hsla[1].toFixed(1)}% , ${hsla[2].toFixed(1)}% , ${this.alpha.toFixed(2)} )`;  
                this.colors.push(svg_text);
            }
    
            this.colors.reverse();            
            return;
        }

        let hsla_start = this._convert_to_hsl(selected_colors.start);
        let hsla_end   = this._convert_to_hsl(selected_colors.end);

        let steps=[];
        for (let idx=0;idx<hsla_start.length;idx++){
            let step = (hsla_end[idx] - hsla_start[idx]) / (this.count-1);
            steps.push(step);
        }
        
        for (let idx=0;idx<this.count;idx++){
            let hsla = [];
            for (let clr=0;clr<hsla_start.length;clr++){
                let value = hsla_start[clr] + (steps[clr] * idx);
                hsla.push(value);
            }

            let svg_text = `hsla( ${hsla[0].toFixed(1)} , ${hsla[1].toFixed(1)}% , ${hsla[2].toFixed(1)}% , ${this.alpha.toFixed(2)} )`;        
            this.colors.push(svg_text);        
        }        
    }

    /**
     * @param {string} rgb
     * @return {number[]}
     */
    _convert_to_hsl(rgb){
        let [r,g,b] = _convert_rgb_to_decimal(rgb);    
        let hsl = this._RGBToHSL(r, g, b);

        return hsl;
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @return {number[]}
     */
    _RGBToHSL(r,g,b) {
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
}

/*********************/
/* Format Convertors */
/*********************/

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

/************************/
/* Text Color Functions */
/************************/

/**
 * @param {number} p
 * @param {number} q
 * @param {number} t
 */
function _hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
}


/**
 * @param {number} h
 * @param {number} s
 * @param {number} l
 */
function _hslToRgb(h, s, l) {
    let r, g, b;
  
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = _hueToRgb(p, q, h + 1/3);
      g = _hueToRgb(p, q, h);
      b = _hueToRgb(p, q, h - 1/3);
    }
  
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * @param {number[]} rgb
 * @return {'black'|'white'}
 */
function _get_text_color_from_rgb(rgb){
    let yiq = ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
    return (yiq >= 128) ? 'black' : 'white';
}

/**
 * @param {string} hsla_color
 */
export function get_text_color(hsla_color){    
    let values = convert_hsla_text_to_array(hsla_color);   

    let rgb = _hslToRgb(values['hue'],values['saturation'],values['light']);
    
    return _get_text_color_from_rgb(rgb);
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
        let rgb = _convert_rgb_to_decimal(color.substring(1));
        return _get_text_color_from_rgb(rgb);
    }

    console.error(`Unknown fill attribute format = ${color}`);
    return 'black';
}

/*******************************/
/* Local Calculation Functions */
/*******************************/

/**
 * @param {string} rgb_hex
 * @return {number[]}
 */
function _convert_rgb_to_decimal(rgb_hex){
    let r = Number(`0x${rgb_hex.substring(0,2)}`);
    let g = Number(`0x${rgb_hex.substring(2,4)}`);
    let b = Number(`0x${rgb_hex.substring(4,6)}`);

    return [r,g,b]
}

