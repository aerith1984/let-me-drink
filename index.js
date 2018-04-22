/**
 * Version: 0.1.4
 * Made by Loggeru
 * update by xiau
 */

// Lein's Dark Root Beer ID
const lainId = 80081;
// How much time in miliseconds should wait after buff (seconds * 1000)
const delay = 200;
// true - Activates notification when you drink / false - Deactivates
const notifications = true;

/**
 * DON'T CHANGE ANYTHING BELOW THIS LINE
 */

const skills = require('./skills');
const Command = require('command');

module.exports = function LetMeDrink(dispatch) {
    const command = Command(dispatch);

    let enabled = true,
        gameId = null,
        job = null,
        curLocation = null,
        itemAmount = null,
        imDrunk = false,
        getInfoCommand = false;

    command.add('letmedrink', () => {
        enabled = !enabled;
        let txt = (enabled) ? 'ENABLED' : 'DISABLED';
        message('Let me Drink is ' + txt, true);
    });

    command.add('getskillinfo', () => {
        getInfoCommand = true;
        message('Use the desired skill and check proxy console.', true);
    });

    dispatch.hook('S_LOGIN', 10, (event) => {
        ({
            gameId,
        } = event);
        job = (event.templateId - 10101) % 100;
    });

    dispatch.hook('C_PLAYER_LOCATION', 3, {
        order: -10
    }, (event) => {
        curLocation = event
    });

    dispatch.hook('S_INVEN', 12, {
        order: -10
    }, (event) => {
        if (!enabled) {
            return;
        }
        let invenList = event.items;
        for (i = 0; i < invenList.length; i++) {
            if (invenList[i].id == lainId) {
                itemAmount = invenList[i].amount;
                break;
            }
        }
    });

    dispatch.hook('S_START_COOLTIME_ITEM', 1, (event) => {
        if (event.item == lainId && imDrunk == false) {
            imDrunk = true;
            setTimeout(() => {
                imDrunk = false;
            }, event.cooldown * 1000);
        }
    });

    dispatch.hook('C_START_SKILL', 5, {
        order: -10
    }, (event) => {
        if (!enabled) {
            return;
        }
        let sInfo = getSkillInfo(event.skill);
        if (getInfoCommand) {
            message('Skill info: (group: ' + sInfo.group + ' / job: ' + job + ')');
            getInfoCommand = false;
        }
        for (s = 0; s < skills.length; s++) {
            if (skills[s].group == sInfo.group && skills[s].job == job && imDrunk == false && itemAmount > 0) {
                useItem();
                break;
            }
        }
    });

    function useItem() {
        setTimeout(() => {
            dispatch.toServer('C_USE_ITEM', 3, {
                gameId: gameId,
                id: lainId,
                dbid: {
                    low: 0,
                    high: 0,
                    unsigned: true
                },
                target: {
                    low: 0,
                    high: 0,
                    unsigned: true
                },
                amount: 1,
                dest: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                loc: curLocation.loc,
                w: curLocation.w,
                unk1: 0,
                unk2: 0,
                unk3: 0,
                unk4: true
            });
            imDrunk = true;
            itemAmount--;
            if (notifications) {
                message('You drank your beer, still have ' + itemAmount + ' more.', true);
            }
            setTimeout(() => {
                imDrunk = false;
            }, 60000);
        }, delay);
    }

    function getSkillInfo(id) {
        let nid = id -= 0x4000000;
        return {
            id: nid,
            group: Math.floor(nid / 10000),
            level: Math.floor(nid / 100) % 100,
            sub: nid % 100
        };
    }

    function message(msg, chat = false) {
        if (chat == true) {
            command.message('(Let Me Drink) ' + msg);
        } else {
            console.log('(Let Me Drink) ' + msg);
        }
    }
}
