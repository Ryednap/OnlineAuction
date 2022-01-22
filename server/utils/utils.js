/**
 * [Parses Date String of the following format to the node-cron schedule String]
 * @param dateObject {String} Expects the format of ('YYYY-MM-DD HH:MM:SS)
 * @returns {`${*} ${*} ${*} ${*} ${*} *`}
 *
 * Verified
 */
const parseCron = (dateObject) => {
    const date = dateObject.split(' ')[0];
    const time = dateObject.split(' ')[1];

    const month = date.split('-')[1];
    const day = date.split('-')[2];
    const hrs = time.split(':')[0];
    const min = time.split(':')[1];
    const sec = time.split(':')[2];
    return `${sec} ${min} ${hrs} ${day} ${month} *`;
};

module.exports = {parseCron};