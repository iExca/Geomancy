/* Custom color plugin
 * by jd and panpawn
 */
'use strict';

const fs = require('fs');

function load() {
	fs.readFile('config/customcolors.json', 'utf8', function (err, file) {
		if (err) return;
		Wisp.customColors = JSON.parse(file);
	});
}
setInterval(function () {
	load();
}, 500);

function updateColor() {
	fs.writeFileSync('config/customcolors.json', JSON.stringify(Wisp.customColors));

	let newCss = '/* COLORS START */\n';

	for (let name in Wisp.customColors) {
		newCss += generateCSS(name, Wisp.customColors[name]);
	}
	newCss += '/* COLORS END */\n';

	let file = fs.readFileSync('config/custom.css', 'utf8').split('\n');
	if (~file.indexOf('/* COLORS START */')) file.splice(file.indexOf('/* COLORS START */'), (file.indexOf('/* COLORS END */') - file.indexOf('/* COLORS START */')) + 1);
	fs.writeFileSync('config/custom.css', file.join('\n') + newCss);
	Wisp.reloadCSS();
}

function generateCSS(name, color) {
	let css = '';
	let rooms = [];
	name = toId(name);
	Rooms.rooms.forEach((curRoom, id) => {
		if (id === 'global' || curRoom.type !== 'chat' || curRoom.isPersonal) return;
		if (!isNaN(Number(id.charAt(0)))) return;
		rooms.push('#' + id + '-userlist-user-' + name + ' strong em');
		rooms.push('#' + id + '-userlist-user-' + name + ' strong');
		rooms.push('#' + id + '-userlist-user-' + name + ' span');
	});
	css = rooms.join(', ');
	css += '{\ncolor: ' + color + ' !important;\n}\n';
	css += '.chat.chatmessage-' + name + ' strong {\n';
	css += 'color: ' + color + ' !important;\n}\n';
	return css;
}

exports.commands = {
	customcolour: 'customcolor',
	customcolor: {
		set: function (target, room, user) {
			if (!this.can('customcolor')) return false;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (!target[1]) return this.parse('/help customcolor');
			if (toId(target[0]).length > 19) return this.errorReply("Usernames are not this long...");

			this.sendReply("|raw|You have given <b><font color=" + target[1] + ">" + Tools.escapeHTML(target[0]) + "</font></b> a custom color.");
			Rooms('upperstaff').add('|raw|' + Tools.escapeHTML(target[0]) + " has recieved a <b><font color=" + target[1] + ">custom color</fon></b> from " + Tools.escapeHTML(user.name) + ".").update();
			this.privateModCommand("(" + target[0] + " has recieved custom color: '" + target[1] + "' from " + user.name + ".)");
			Wisp.customColors[toId(target[0])] = target[1];
			updateColor();
		},
		delete: function (target, room, user) {
			if (!this.can('customicon')) return false;
			if (!target) return this.parse('/help customcolor');
			if (!Wisp.customColors[toId(target)]) return this.errorReply('/customcolor - ' + target + ' does not have a custom color.');
			delete Wisp.customColors[toId(target)];
			updateColor();
			this.sendReply("You removed " + target + "'s custom color.");
			Rooms('upperstaff').add(user.name + " removed " + target + "'s custom color.").update();
			this.privateModCommand("(" + target + "'s custom color was removed by " + user.name + ".)");
			if (Users(target) && Users(target).connected) Users(target).popup(user.name + " removed your custom color.");
			return;
		},
		preview: function (target, room, user) {
			if (!this.runBroadcast()) return;
			target = target.split(',');
			for (let u in target) target[u] = target[u].trim();
			if (!target[1]) return this.parse('/help customcolor');
			return this.sendReplyBox('<b><font size="3" color="' + target[1] + '">' + Tools.escapeHTML(target[0]) + '</font></b>');
		},
		reload: function (target, room, user) {
			if (!this.can('hotpatch')) return false;
			updateColor();
			this.privateModCommand("(" + user.name + " has reloaded custom colours.)");
		},
		'': function (target, room, user) {
			return this.parse("/help customcolor");
		},
	},
	customcolorhelp: [
		"Commands Include:",
		"/customcolor set [user], [hex] - Gives [user] a custom color of [hex]",
		"/customcolor delete [user], delete - Deletes a user's custom color",
		"/customcolor reload - Reloads colours.",
		"/customcolor preview [user], [hex] - Previews what that username looks like with [hex] as the color.",
	],
};
