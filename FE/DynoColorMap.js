import { DynoSvg } from './DynoSvg.js';
import { get_colors, get_text_color, get_schemes } from './DynoTools.js';

function color_map(){
    var svg = new DynoSvg('graph_id');
    const COLUMN_SIZE = 10;
    const ROW_SIZE = 15;
    const SPACING = 10;
    const MARGIN = 10;

    let rect_width = (svg.get_width() - SPACING * COLUMN_SIZE - MARGIN * 2) / COLUMN_SIZE;
    let rect_height = (svg.get_height() - SPACING * ROW_SIZE - MARGIN * 2) / ROW_SIZE;

    let schemes = get_schemes();
        
    for (let row=0;row<schemes.length;row++){
        let test = {'test' : schemes[row]}
        let colors = get_colors(test, 'test', 1.0, COLUMN_SIZE);

        for (let column=0;column<COLUMN_SIZE;column++){        
            let x_pos = column * (rect_width + SPACING) + MARGIN;
            let y_pos = row * (rect_height + SPACING) + MARGIN;
            
            let text_color = get_text_color(colors[column]);
            svg.rectangle(x_pos, y_pos, rect_width, rect_height, colors[column], 'black', 3, false);
            svg.text(`${colors[column]}`, x_pos+5, y_pos - rect_height/2, 14, rect_width-10, rect_height-5, text_color, 'center', 'center')

        }        
    }
}

color_map();
