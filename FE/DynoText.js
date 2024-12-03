import './DynoTypedef.js'

/************************/
/* DynoText             */
/* Text Format Manager  */
/************************/

const PREFIX = {'usd' : '$', 'ringgit' : 'RM', 'gbp': '£', 'dkk': 'kr'};

export class DynoText{
    /**
     *  @param {TYPE_LABEL_MODE} label_mode
     *  @param {TYPE_LABEL_DATE} date_type
     *  @param {TYPE_LABEL_CURRENCY} currency_type
     *  @param {number|null} max_value
     */
    constructor(label_mode, date_type, currency_type, max_value){
        this.label_mode = label_mode;
        this.date_type = date_type;
        this.currency_type = currency_type;

        this.max_value = max_value;
    }

    /**
     * @param {Date} date
     * @return {string}
     */
    _display_date(date){
        switch(this.date_type){
            case 'full':
                return `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`;
            case 'month_year':
                return `${date.getMonth()+1}-${date.getFullYear()}`;
            case 'day_month':
                return `${date.getDate()}-${date.getMonth()+1}`;
            default:
                console.error(`Unsupported date_type = ${this.date_type}`);
                return 'Error!';
        }
    }

    /**
     * @param {string|number} value
     */
    _display_currency(value){
        let value_number = 0;
        if (typeof value === 'string'){
            value_number = parseFloat(value);
            /* If Failed to Convert String, assume it is to be used as is */
            if (Number.isNaN(value_number)){
                return value;
            }
        } else {
            value_number = value;
        }

        if (this.currency_type == 'yen' || value_number >= 1000){
            value_number.toFixed(0);
        } else {
            value_number.toFixed(2);
        }

        return `${PREFIX[this.currency_type]}${value_number}`;
    }

    /**
     * @param {number | string} value
     */
    _display_percentage(value){
        if (typeof value === 'string'){
            let number_value = parseFloat(value);
            if (Number.isNaN(number_value) == true){
                return number_value;
            }

            value = number_value;
        }

        if (Math.abs(value) < 10){
            value = value.toFixed(2);
        } else if (Math.abs(value) < 100){
            value = value.toFixed(1);
        } else {
            value = value.toFixed(0);
        }

        return `${value}%`;
    }

    /**
     * @param {number} value
     */
    _display_number(value){
        let max_value = (this.max_value == null) ? value : this.max_value;
        let decimal = 0;
        if (max_value <= 1){
            decimal = 4;
        } else if (max_value <= 10){
            decimal = 2;
        } else if (max_value <= 100){
            decimal = 1;
        }

        return value.toFixed(decimal);
    }

    /**     
     * @param {string|number|Date} value
     * @return {string}
     */

    display_value_string(value){        
        if (Object.prototype.toString.call(value) == '[object Date]'){
            //@ts-ignore
            return this._display_date(value);
        }

        if (this.label_mode == 'date'){
            let date = new Date(value);
            return this._display_date(date);
        }

        if (this.label_mode == 'string'){            
            return `${value}`;
        }

        if (this.label_mode == 'percentage'){
            //@ts-ignore
            return this._display_percentage(value);
        }

        if (this.label_mode == 'currency'){
            //@ts-ignore
            return this._display_currency(value);
        }

        if (this.label_mode == 'number'){
            //@ts-ignore
            return this._display_number(value);
        }

        console.error(`Unknown Format = ${this.label_mode}`);

        return 'Error!';
    }

    /**
     * @param {TYPE_LABEL_MODE} mode
     */
    set_mode(mode){
        console.log(`mode = ${mode}`);
        this.label_mode = mode;
    }

    /**
     * @param {TYPE_LABEL_DATE} date_type
     */
    set_date_type(date_type){
        this.date_type = date_type;
    }

    /**
     * @param {TYPE_LABEL_CURRENCY} currency_type
     */
    set_currency_type (currency_type){
        this.currency_type = currency_type;
    }
}
