import { DynoBubble} from './DynoBubble.js'
import { DynoPie } from './DynoPie.js';
import { DynoBar } from './DynoBar.js';
import { DynoRadar } from './DynoRadar.js';
import { DynoLine } from './DynoLine.js';
import { DynoConfig } from './DynoConfig.js';
import { DynoSvg } from './DynoSvg.js';
import { DynoHeatmap} from './DynoHeatmap.js'
import { Sleep } from '../../FasterOrsted/FE/helpers.js';

import { SelectorDropDownCtrl } from '../../FasterOrsted/FE/SelectorDropDownCtrl.js';
import { convert_hsla_text_to_array } from './DynoTools.js';

/*************/
/* Selectors */
/*************/

var select_graph = new SelectorDropDownCtrl('select_graph_id', 'select_graph', 'Select Graph Type', callback_graph_selected, true, true, 220, null);
await select_graph.set_items(['Bar', 'Line', 'Bubble', 'Pie', 'Radar', 'Heatmap', 'Text', 'Circle'], null);
await select_graph.draw();

/**
 * @param {string} selected
 */
async function callback_graph_selected(selected){    
    let id = 'graph_id';
    let parent = document.getElementById(id);
    if(parent != null){
        while(parent.children.length > 0){
            parent.children[0].remove();
        }
    }
    switch(selected){
        case 'Bar':
            bar_graph(id);
            break;
        case 'Line':
            line_graph(id);
            break;
        case 'Bubble':
            bubble_graph(id);
            break;
        case 'Pie':
            pie_graph(id);
            break;
        case 'Radar':
            radar_graph(id);
            break;
        case 'Heatmap':
            heatmap_graph(id);
            break;
        case 'Text':
            direct_text(id);
            break;
        case 'Circle':
            direct_circle(id);
            break;
        default:
            console.error(`Unsupported Graph Type = ${selected}`);
            break;
    }
}

/**************/
/* Draw Graph */
/**************/

/**
 * @param {string} id
 */

function bar_graph(id){
    var graph_data = {
        'January'   : [{'Food & Bevarages': 800.25, 'Travel': 500, 'Housing': 2050, 'Personal': 250}, {'Food & Bevarages': 801.25, 'Travel': 650, 'Housing': 2050},{'Food & Bevarages': 800.25, 'Travel': 500, 'Housing': 2050}],
        'February'  : [{'Food & Bevarages': 800.25, 'Travel': 700, 'Housing': 2050}, {'Food & Bevarages': 830.25, 'Travel': 770, 'Housing': 2050}],
        'March'     : [{'Food & Bevarages': 800.25, 'Travel': 800, 'Housing': 2050}, {'Food & Bevarages': 930.25, 'Travel': 710, 'Housing': 2050}],
        'April'     : [{'Food & Bevarages': 800.25, 'Travel': 400, 'Housing': 2050}, {'Food & Bevarages': 510.25, 'Travel': 870, 'Housing': 2050}],
    }

    var graph_data2 = {
        'January'   : { 
            "Muzaffar"  : {'Food & Bevarages': 800.25, 'Travel': 500, 'Housing': 2050, 'Personal': 150},
            "Yui"       : {'Food & Bevarages': 801.25, 'Travel': 650, 'Housing': 2050},
            "NekoKun"   : {'Food & Bevarages': 800.25, 'Travel': 500, 'Housing': 2050}
        },
        'February'  : {
            "Muzaffar" : {'Food & Bevarages': 800.25, 'Travel': 700, 'Housing': 2050},
            "Yui"       : {'Food & Bevarages': 801.25, 'Travel': 650, 'Housing': 2050},
        },
        'March'     : {
            "Muzaffar" : {'Food & Bevarages': 800.25, 'Travel': 800, 'Housing': 2050}, 
            "Yui":       {'Food & Bevarages': 930.25, 'Travel': 710, 'Housing': 2050},
        },
        'April'     : {
            "Muzaffar" : {'Food & Bevarages': 800.25, 'Travel': 400, 'Housing': 2050}, 
            "Yui"      : {'Food & Bevarages': 510.25, 'Travel': 870, 'Housing': 2050}
        }
    }

    var dyno_config = new DynoConfig('bar');
    dyno_config.set_axis_range(0, null, null, null);
    dyno_config.set_axis_roundup(true, false);
    dyno_config.set_label_type('ringgit');
    dyno_config.set_color_schemes({'Muzaffar': 'teal', 'Yui': 'blue', 'NekoKun': 'grey'});

    var dyno_graph = new DynoBar(id, graph_data2, dyno_config)
}

/**
 * @param {string} id
 */
async function line_graph(id){
    var graph_data = {
            'error' : [[1, 0.9], [2, 0.8], [3, 0.85], [4,0.6], [5, 0.3], [6, 0.2]], 
            'accuracy': [[1, 0.1], [2, 0.2], [3, 0.2], [4,0.25], [5, 0.3], [6, 0.35]]
        };


    var dyno_config = new DynoConfig('line');
    dyno_config.set_axis_range(0, 1.0, 0, 10);
    dyno_config.set_axis_roundup(true, true);
    dyno_config.set_label_type('number');
    dyno_config.set_step_size(5);
    dyno_config.set_step_min_count(15);

    
    var dyno_graph = new DynoLine(id, dyno_config, graph_data);

    await Sleep(1000);

    
    dyno_graph.add_point('accuracy', [7, 0.4]);
    await Sleep(1000);    
    dyno_graph.add_point('accuracy', [8, 0.5]);
    await Sleep(500);
    dyno_graph.add_point('accuracy', [9, 0.3]);
}

/**
 * @param  {number} band
 * @param  {number} max
 * @return {number}
 */
function get_skill(band, max){
    let mean = ((13-band) * 0.6);
    let stdev = 0.5;

    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    let value = (z * stdev) + mean;
    value = (value>max) ? max : value;

    return Math.round(value*100) / 100;
}


function role_fte(){
    return {
        "App Arch"  : [3, 3, 3, 10],
        "Ent. Arch" : [3.5, 4, 3, 9],
        "Sol Arch"  : [4, 5, 3, 9],
        "Sol Man"   : [4.5, 4, 3, 8],
        "Sol Man2"   :[5, 5, 3, 7]
    }
}

/**
 * @param {number} band
 */
function generate_fte(band){
    let softskill = get_skill(band, 5);
    let domain    = get_skill(band, 5);
    let potential = ((softskill + domain) + (Math.random() * 5)) / 3;
    potential = Math.round(potential*100)/100;

    softskill = (softskill<1) ? 1 : softskill;
    domain = (domain<1) ? 1 : domain;

    return [domain, softskill, potential, band];
}

/**
 * @param {string} id
 */
function bubble_graph(id){
    /**@type {{[x:string]: {[y:string] : number[]}}} */
    let graph_data = {};
    let bands = [13, 12, 11, 10, 9, 8, 7];
    let count = {13 :3,  12: 10, 11: 10, 10: 20, 9: 5, 8: 2, 7: 1};
    graph_data["Architects"] = role_fte();
    graph_data["SE"] = {};
    for (let band of bands){
        for (let idx=0;idx<count[band];idx++){
            let fte = generate_fte(band);
            graph_data["SE"][`${idx}`] = fte;
        }
    }

    

    // for (let competency of ['Software Engineering', 'Infra']){
    //     graph_data[competency] = {};        
    //     for (let band of bands){
    //         for (let idx=0;idx<count[band];idx++){
    //             let fte = generate_fte(band);
    //             graph_data[competency][`${idx}`] = fte;
    //         }
    //     }
    // }
        
    var dyno_config = new DynoConfig('bubble');    
    dyno_config.set_axis_range(0, 5, 0, 5);
    dyno_config.set_axis_roundup(true, true);
    dyno_config.set_label_type('number');
    dyno_config.set_color_schemes({'SE': 'red', 'Architects': 'teal'});
    dyno_config.range_radius = {'min': 0, 'max': 5};
    // dyno_config.range_color  = {'min': 7, 'max': 13};
    dyno_config.color_alpha['SE'] = 0.5;
    dyno_config.graph_margin.top = 100;
    dyno_config.graph_margin.right = 100;

    
            
    var dyno_graph = new DynoBubble(id, graph_data, dyno_config);
}

/**
 * @param {string} id
 */
function pie_graph(id){
    let graph_data = {
        'Maybank': 5000, 'CIMB': 3000, 'RHB': 7000, 'Ambank' : 8000
    };

    let dyno_config = new DynoConfig('pie');
    dyno_config.set_label_type('ringgit');
    dyno_config.set_color_schemes({'pie': 'red'});
    dyno_config.graph_margin.top = 20;
    dyno_config.graph_margin.bottom = 20;

    let dyno_graph = new DynoPie(id, graph_data, dyno_config);
}

/**
 * @param {string | HTMLDivElement} id
 */
function radar_graph(id){
    // let graph_data = {
    //     'Apple'     : {'Price': 3, 'Camera Quality' : 4, 'Battery': 3, 'Design':2, 'Usefullness': 2, 'Color': 5, 'Weight': 2, 'Slim': 5},
    //     'Sony'      : {'Price': 5, 'Camera Quality' : 4, 'Battery': 2, 'Design':3, 'Usefullness': 1, 'Color': 5, 'Weight': 3, 'Slim': 4},
    //     'Google'    : {'Price': 4, 'Camera Quality' : 2, 'Battery': 3, 'Design':4, 'Usefullness': 2, 'Color': 5, 'Weight': 4, 'Slim': 3}
    // }

    // let graph_data = {
    //     'PIOGR'     : {'Programming': 4, 'Dev Ops': 3, 'Soft Skills': 3, 'Band': 3},
    //     'SOL ARCH'  : {'Programming': 4, 'Dev Ops': 5, 'Soft Skills': 4, 'Band': 4},
    // }

    
    let graph_data = {
        'PIOGR'     : {'IaC': 5, 'Data': 2, 'Security': 3, 'Cost Optimization': 1, 'AWS': 4, 'Azure': 2},
        'SOL ARCH'  : {'IaC': 5, 'Data': 4, 'Security': 4, 'Cost Optimization': 3, 'AWS': 4, 'Azure': 4},
    }


    let dyno_config = new DynoConfig('radar');
    dyno_config.radar_max_value = 5;
    dyno_config.graph_margin = {'left': 100, 'right':200, 'top': 150, 'bottom':150}
    dyno_config.set_color_schemes({'radar': 'teal'})

    let dyno_graph = new DynoRadar(id, graph_data, dyno_config);
}

/**
 * @param {string | HTMLDivElement} id
 */
function direct_text(id){    
    let svg = new DynoSvg(id);
    let text_elements = [
        {'y': 100, 'x': 200, 'width': 150, 'height': 80, 'horizontal': 'right', 'vertical': 'bottom'},
        {'y': 200, 'x': 200, 'width': 500, 'height': 80, 'horizontal': 'right', 'vertical': 'bottom'},
        {'y': 300, 'x': 200, 'width': 500, 'height': 24, 'horizontal': 'right', 'vertical': 'bottom'},
        {'y': 400, 'x': 200, 'width': 150, 'height': 24, 'horizontal': 'right', 'vertical': 'bottom'},
        {'y': 500, 'x': 200, 'width': 150, 'height': 24, 'horizontal': 'left',  'vertical': 'top'},
        {'y': 600, 'x': 200, 'width': 150, 'height': 24, 'horizontal': 'center','vertical': 'center'},
        {'y': 700, 'x': 200, 'width': 150, 'height': 80, 'horizontal': 'center', 'vertical': 'bottom'},
        {'y': 800, 'x': 200, 'width': 150, 'height': 80, 'horizontal': 'center', 'vertical': 'center'},
        {'y': 900, 'x': 200, 'width': 150, 'height': 80, 'horizontal': 'center', 'vertical': 'top'},
        {'y': 100, 'x': 800, 'width': 500, 'height': 80, 'horizontal': 'left', 'vertical': 'center'},
        {'y': 200, 'x': 800, 'width': 500, 'height': 80, 'horizontal': 'center', 'vertical': 'center'},
        {'y': 300, 'x': 800, 'width': 500, 'height': 80, 'horizontal': 'right', 'vertical': 'center'},
    ]

    for (const element of text_elements){
        svg.rectangle(element.x,element.y-element.height/2,element.width,element.height,'transparent','blue',1,false);
        //@ts-ignore
        svg.text('MuzaffaryQq', element.x, element.y, 24, element.width, element.height, 'goldenrod', element.horizontal, element.vertical);  
        svg.line(element.x,element.y,element.x+element.width,element.y,0.5,'grey',false);    
    }
}

const BOTTOM_LEFT = 'bottom_left';
const BOTTOM_RIGHT = 'bottom_right';
const TOP_RIGHT = 'top_right';
const TOP_LEFT = 'top_left';
const MARGIN = 8;

/**
 * @param {number} angle
 */
function _quadrant(angle){
    if (angle < Math.PI/2){
        return BOTTOM_RIGHT;
    }

    if (angle < Math.PI){
        return BOTTOM_LEFT;
    }

    if (angle < 1.5 * Math.PI){
        return TOP_LEFT;
    }

    return TOP_RIGHT;
}

/**
 * @param {string | HTMLDivElement} id
 */
function direct_circle(id){
    let svg = new DynoSvg(id);
    let param = {'cx': 1000, 'cy': 600, 'radius': 300};
    svg.circle(param, 'transparent', 'black', 1, false);
    let radian = 2 * Math.PI;
    let r_step = (radian/16);

    let rect_width = 150;
    let rect_height = 32;

    let rx = 0;
    let ry = 0;

    /**@type {'left'|'right'|'center'} */
    let horizontal = 'left';
    /**@type {'top'|'bottom'|'center'} */
    let vertical = 'top';

    for (let angle=0;angle<Math.PI*2;angle=angle+r_step){
        let y = param.radius * Math.sin(angle) + param.cy;
        let x = param.radius * Math.cos(angle) + param.cx;

        let dot = {'cx': x, 'cy': y, 'radius': 5};

        svg.circle(dot, 'black', 'black', 1, false);

        let quandrant = _quadrant(angle);
        let edge = ((angle % (1.57)) < 0.1) ? Math.round(angle/1.57) : -1;
        
        ry = dot.cy;
        rx = dot.cx;
        if (quandrant == BOTTOM_LEFT){ 
            rx = rx - rect_width;
            horizontal = 'right';
            vertical = 'center';
        }

        if (quandrant == TOP_LEFT){
            rx = rx - rect_width;
            ry = ry - rect_height;
            horizontal = 'right';
            vertical = 'center';
        }

        if (quandrant == TOP_RIGHT){
            ry = ry - rect_height;
            horizontal = 'left';
            vertical = 'center';
        }

        if (edge == 0){
            ry = ry - (rect_height/2);
            rx = rx + MARGIN;
            horizontal = 'left';
            vertical = 'center';
        }

        if (edge == 1){
            rx = rx + rect_width/2;
            ry = ry + MARGIN;
            horizontal = 'center';
            vertical = 'center';
        }

        if (edge == 2){
            ry = ry + (rect_height/2);
            rx = rx - MARGIN;
            horizontal = 'right';
            vertical = 'center';
        }

        if (edge == 3){            
            rx = rx - rect_width/2;
            ry = ry - MARGIN;
            horizontal = 'center';
            vertical = 'center';
        }
        
 
        svg.rectangle(rx, ry, rect_width, rect_height, 'transparent', 'black', 1, false);
        svg.text(edge.toFixed(0), rx, ry+rect_height/2, 24, rect_width, rect_height, 'red', horizontal, vertical);

    }
}

/**
 * @param {{ x: number; y: number; }} point1
 * @param {{ x: number; y: number; }} point2
 */
function _distance(point1, point2){
    let x_sq = (point1.x-point2.x) ** 2;
    let y_sq = (point1.y-point2.y) ** 2;

    return Math.sqrt(x_sq + y_sq);
}

const X_MAX = 160;
const Y_MAX = 200;
const STEP = 20
/**
 * @param {DynoSvg} svg
 * @param {number} x_start
 * @param {number} y_start
 * @param {{}} edge_colors
 */
function _fill(svg, x_start, y_start, edge_colors){
    let color_keys = ['hue', 'saturation', 'light', 'alpha'];
    for (let y=0;y<=Y_MAX;y=y+STEP){
        for (let x=0;x<=X_MAX;x=x+STEP){ 
            
            let point = {'x': x, 'y': y};
            let color_values = [];

            /* Calculate Distances */
            let total_distance = 0;
            let distances = [];            
            for (let edge_color of Object.values(edge_colors)){
                let distance = _distance(point, edge_color);
                distance = (distance == 0) ? 1 : 1/distance;
                distances.push(distance);
                total_distance += distance;
            }

            /* Calculate Color based on Distance */            
            for (let color of color_keys){
                let value = 0;
                let idx = 0;
                for (let edge_color of Object.values(edge_colors)){
                    value = value + (edge_color.color[color] * (distances[idx] / total_distance)); 
                    idx++;
                }                 
                color_values.push(value);
            }

            let hsla = `hsla( ${color_values[0]} , ${color_values[1]*100}% , ${color_values[2]*100}% , ${color_values[3]} )`;

            let width = STEP;
            let height = STEP;

        svg.rectangle(x+x_start, y+y_start, width, height, hsla, hsla, 0, false);        
        }            
    }                    

}
/**
 * @param {DynoSvg} svg
 * @param {number} x_start
 * @param {number} y_start
 * @param {{x:number, y:number, color:{hue:number, saturation:number, light:number, alpha:number}}[]} edge_colors
 */
function _fill_single(svg, x_start, y_start, edge_colors){
    for (let edge of edge_colors){
        let hsla = `hsla( ${edge.color.hue} , ${edge.color.saturation*100}% , ${edge.color.light*100}% , ${edge.color.alpha} )`;
        svg.rectangle(edge.x+x_start, edge.y+y_start, STEP, STEP, hsla, hsla, 0, false);
    }
}

/**
 * @param {string | HTMLDivElement} id
 */

function direct_gradient(id){
    let svg = new DynoSvg(id);    
    let x_offset = 10;
    let y_offset = 10;    

    let edge_colors1 = [
        {'x':0, 'y': 0,         'color' : {'hue': 0,    'saturation': 1, 'light': 0.3, 'alpha': 1}},
        {'x':0, 'y': Y_MAX,     'color' : {'hue': 90,   'saturation': 1, 'light': 0.3, 'alpha': 1}},
        {'x':X_MAX, 'y': 0,     'color' : {'hue': 0,  'saturation': 1, 'light': 0.3, 'alpha':1}},
        {'x':X_MAX, 'y': Y_MAX, 'color' : {'hue': 90,  'saturation':1, 'light': 0.3, 'alpha': 1}},
    ];

    let edge_colors2 = [
        {'x':0, 'y': 0,         'color' : {'hue': 90,    'saturation': 1, 'light': 0.3, 'alpha': 1}},
        {'x':0, 'y': Y_MAX,     'color' : {'hue': 0,   'saturation': 1, 'light': 0.3, 'alpha': 1}},
        {'x':X_MAX, 'y': 0,     'color' : {'hue': 90,   'saturation': 1, 'light': 0.3, 'alpha': 1}},
        {'x':X_MAX, 'y': Y_MAX, 'color' : {'hue': 0,  'saturation': 1, 'light': 0.3, 'alpha': 1}},
    ];

    
    _fill(svg, x_offset, y_offset, edge_colors1);
    _fill(svg, x_offset, y_offset+Y_MAX, edge_colors2);

    
    // _fill_single(svg, x_offset, y_offset, edge_colors1);
    // _fill_single(svg, x_offset, y_offset+Y_MAX, edge_colors2);

}

/**
 * @param {number} min
 * @param {number} max
 * @param {number} skew
 */
function _random_gaussian(min, max, skew) {
    let u=0;
    let v=0;    

    //Converting [0,1) to (0,1)
    while(u === 0){
        u = Math.random(); 
    };

    while(v === 0){
        v = Math.random()
    } 
    
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
    
    // Translate to 0 -> 1
    num = num / (10.0 + 0.5);
    // resample between 0 and 1 if out of range 
    if (num > 1 || num < 0){
        num = _random_gaussian(min, max, skew) 
    } else {
      num = Math.pow(num, skew) // Skew
      num *= max - min // Stretch to fill range
      num += min // offset to min
    }
    
    return num
  }
function _generate_gaussian_matrix(){
    const SIZE_X = 5;
    const SIZE_Y = 5;
    const VALUE_MAX = 10;
    const VALUE_MIN = 0;

    let matrix = [];

    for (let y=0;y<SIZE_X;y++){
        let row = []
        for (let x=0; x<SIZE_Y;x++){
            let x_skew = Math.abs(x - SIZE_X/2) / (SIZE_X/2);
            let y_skew = Math.abs(y - SIZE_Y/2) / (SIZE_Y/2);
            let skew = x_skew + (y_skew * 2) + 0.2;
            
            let value = _random_gaussian(VALUE_MIN, VALUE_MAX, skew);
            row.push(value);
        }
        matrix.push(row);
    }

    return matrix;
}

/**
 * @param {string | HTMLDivElement} id
 */

function heatmap_graph(id){
    let data = _generate_gaussian_matrix();
    // let data = [[0,1,2,3,4,5],[0,1,2,3,4,5], [0,1,2,3,4,5], [0,1,2,3,4,5], [0,1,2,3,4,5]];
    // let data = [[0,1,2],[0,1,2],[0,1,2]];    
    let config = new DynoConfig("Heatmap");
    config.set_color_schemes({'heatmap': 'cyan'})

    let heatmap = new DynoHeatmap(id, data, config);
}

// heatmap_graph('graph_id');
// direct_gradient('graph_id');