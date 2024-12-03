/**@typedef {{'min' : null|number, 'max': null|number}} TypeRangeNull */
/**@typedef {{'min' : number, 'max': number}} TypeRange */

export class DynoRange{
    constructor(){
        /**@type TypeRangeNull */
        this.user = {'min': null, 'max': null};

        /**@type TypeRange */
        this.actual = {'min': 0, 'max': 0};

        /**@type TypeRange */
        this.use = {'min': 0, 'max': 0};

        /**@type number */
        this.range = 0;
    }

    /**
     * @param {number|null} min
     * @param {number|null} max
     */
    set_user(min, max){
        let check_max = (max == null) ? this.user.max : max;
        if (min != null && check_max != null){
            if (min >= check_max){
                console.error(`Min ${min} >= ${check_max}`);
                return;
            }
        }

        let check_min = (min == null) ? this.user.min : min;
        if (max != null && check_min != null){
            if (max <= check_min){
                console.error(`Max ${max} <= ${check_min}`);
                return;
            }
        }

        this.user.min = min;
        this.user.max = max;

        this._calc_use();
    }

    /**
     * @param {number[]} data
     */
    set_actual(data){
        this.actual.min = Math.min(...data);
        this.actual.max = Math.max(...data);

        this._calc_use();
    }

    _calc_use(){
        let min = (this.user.min == null) ? this.actual.min : this.user.min;
        let max = (this.user.max == null) ? this.actual.max : this.user.max;

        this.use.min = min;
        this.use.max = max;

        if (min >= max){
            console.error(`Min ${min} > Max ${max}`);
            this.use.min = this.actual.min;
            this.use.max = this.actual.max;                  
        }          
        

        this.range = this.use.max - this.use.min;
    }

    /**
     * @return {number}
     */
    get_max(){
        return this.use.max;
    }

    /**
     * @return {number}
     */
    get_min(){
        return this.use.min;
    }
    
    /**
     * @return {number}
     */
    get_range(){
        return this.range;
    }
}