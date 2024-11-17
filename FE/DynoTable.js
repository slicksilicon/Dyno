import { DivCtrl, getSVGNS, GetComputedHeight, GetComputedWidth } from '../../FasterOrsted/FE/helpers.js';
import { HEADER_EMPLOYEE_NAME } from '../../TalentMap/FE/DataHeaders.js';

export class DynoTable{    
    /**
     * @param {string | HTMLDivElement} div
     * @param {string[]} headers     
     */
    constructor(div, headers){
        this.div = DivCtrl(div, 'div');
        this.headers = headers;
        this.data = [];
        this.table = null;
        this.widths = {};
        this.callback_row = null;
    }

    /**
     * @param {string} header
     * @param {number} width
     */
    set_column_widths(header, width){
        this.widths[header] = width;
    }

    /**
     * @param {CallableFunction} callback
     */
    set_row_click_callback(callback){
        this.callback_row = callback;
    }

    /**
     * @param {{}[]} data
     */
    draw(data){
        this.data = data;
        this.clear();
        this._draw();
    }

    clear(){
        if (this.table == null){
            return;
        }

        while(this.table.children.length > 0){
            this.table.children[0].remove();
        }

        this.table.remove();
        this.table = null;
    }

    /**
     * @param {string} tag
     * @param {string[]} classses
     * @param {'col'|'row'|null} scope
     * @param {string|null} content     
     * @param {HTMLElement|null} parent
     * @param {string|null}id
     * @return {HTMLElement}
     */
    _create_element(tag, classses, scope, content, parent, id){
        let element = document.createElement(tag);
        for (let cls of classses){
            element.classList.add(cls);
        }

        if (scope != null){
            element.setAttribute('scope', scope);
        }


        if (content != null){
            element.innerHTML = content;
        }

        if (parent != null){
            parent.appendChild(element);
        }

        if (id != null){
            element.id = id;
        }
        

        return element;

    }

    /**
     * @param {HTMLElement} table
     * @param {{}} widths
     */
    _create_header(table, widths){
        let thead = this._create_element('thead', [], null, null, table, null);
        let tr = this._create_element('tr',[],null,null, thead, null);
        for (let header of this.headers){
            let column = this._create_element('th', [], 'col', header, tr, null);
            if (header in widths){
                column.setAttribute('style', `width : ${widths[header]}px`);
            }

        }                
    }

    /**
     * @param {{}} row
     * @param {HTMLElement} parent
     * @param {string} id
     */
    _create_row(row, parent, id){
        let trow = this._create_element('tr', [], null, null, parent, id);
        trow.addEventListener('click', this._callback_row.bind(this));
        for (let header of this.headers){
            let value = (header in row) ? row[header] : '-';
            this._create_element('td', ['table-primary'], 'row', value, trow, id);
        }

    }

    _draw(){
        this.table = this._create_element('table', ['table', 'table-dark'], null, null, this.div, null);
        this.table.setAttribute('style', 'font-size : 12px');
        this._create_header(this.table, this.widths);        
        let body = this._create_element('tbody', [], null, null, this.table, null);
        let idx = 0;
        for (let row of this.data){
            this._create_row(row, body, `${idx}`);
            idx++;
        }
    }


    /**
     * @param {PointerEvent} event
     */
    _callback_row(event){
        // @ts-ignore
        let row_number = event.target.id;
        if (typeof row_number === 'undefined'){
            console.log('event does not contain a valid id');
            return;
        }      

        if (this.callback_row != null){
            let name = this.data[row_number][HEADER_EMPLOYEE_NAME];
            if (typeof name === 'undefined'){
                console.log(`Failed to get name for row = ${row_number}`);
                return;
            }            
            this.callback_row(name);
        }
    }
}