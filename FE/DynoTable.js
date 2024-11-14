import { DivCtrl, getSVGNS, GetComputedHeight, GetComputedWidth } from '../../FasterOrsted/FE/helpers.js';

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
    }

    /**
     * @param {string} header
     * @param {number} width
     */
    set_column_widths(header, width){
        this.widths[header] = width;
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
     * @return {HTMLElement}
     */
    _create_element(tag, classses, scope, content, parent){
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

        return element;

    }

    /**
     * @param {HTMLElement} table
     * @param {{}} widths
     */
    _create_header(table, widths){
        let thead = this._create_element('thead', [], null, null, table);
        let tr = this._create_element('tr',[],null,null, thead);
        for (let header of this.headers){
            let column = this._create_element('th', [], 'col', header, tr);
            if (header in widths){
                column.setAttribute('style', `width : ${widths[header]}px`);
            }

        }                
    }

    /**
     * @param {{}} row
     * @param {HTMLElement} parent
     */
    _create_row(row, parent){
        let trow = this._create_element('tr', [], null, null, parent);
        for (let header of this.headers){
            let value = (header in row) ? row[header] : '-';
            this._create_element('td', ['table-primary'], 'row', value, trow);
        }

    }

    _draw(){
        this.table = this._create_element('table', ['table', 'table-dark'], null, null, this.div);
        this.table.setAttribute('style', 'font-size : 12px');
        this._create_header(this.table, this.widths);        
        let body = this._create_element('tbody', [], null, null, this.table);
        for (let row of this.data){
            this._create_row(row, body);
        }
    }
}