
/**
 * @function limitTo
 * @description limit number to certain range.
 * @param {number} [num] input number
 * @param {number} [min] lower limit
 * @param {number} [max] upper limit
 * @returns {number} number
 */
const limitTo = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * @function random
 * @description return random number between min and max.
 * @param {number} [min] lower bound of random
 * @param {number} [max] upper bound of random
 * @returns {number} random number
 */
const random = (min, max) => (Math.random() * (max - min)) + min;

/**
 * @function map
 * @description map value from one range to another.
 * @param {number} [num] input number
 * @param {number} [in_min] lower bound of input range
 * @param {number} [in_max] upper bound of input range
 * @param {number} [out_min] lower bound of ouput range
 * @param {number} [out_max] upper bound of output range
 * @returns {number} mapped input number
 */
const map = (num, in_min, in_max, out_min, out_max) => {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

/**
 * @function toRadians
 * @description convert angle from degrees to radians
 * @param {number} [degrees] angle in degress
 * @returns {number} angle in radians
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * @function angle
 * @description calculate angle (in degrees) between three points
 * @param {object} p1 coordinates of center points
 * @param {object} p2 coordinates of leg point
 * @param {object} p3 coordinates of leg point
 * @returns {number} angle
 */
const angle = function (p1, p2, p3) {
    const p12 = Math.sqrt(Math.pow((p1.x - p2.x),2) + Math.pow((p1.y - p2.y),2));
    const p13 = Math.sqrt(Math.pow((p1.x - p3.x),2) + Math.pow((p1.y - p3.y),2));
    const p23 = Math.sqrt(Math.pow((p2.x - p3.x),2) + Math.pow((p2.y - p3.y),2));
    return Math.acos(((Math.pow(p12, 2)) + (Math.pow(p13, 2)) - (Math.pow(p23, 2))) / (2 * p12 * p13)) * 180 / Math.PI;
}; 

module.exports = { 
    limitTo,
    random,
    map,
    toRadians,
    angle
};