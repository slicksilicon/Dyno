import { CheckType } from "../../FasterOrsted/FE/helpers.js";

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
