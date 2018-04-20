const Purdy = require('purdy');

class Tree {
    constructor (flow) {
        this.flow = {
            label: 'root',
            task: flow,
            depends: []
        };
        this.indentLevel = 0;
        this.out = '';
    };

    show() {

        // const Blur = require('blur');
        // const show = Blur(this.flow, { _settings: Blur.remove, _final: Blur.remove, _type: Blur.remove, _isMercy: Blur.remove });
        // var p = require('purdy');
        // p(show, { depth: 99 });

        this.traverse(this.flow);
        console.log(this.out);
    };

    traverse(flow) {

        if (typeof(flow.task) === 'function') {
            let label = ''
            if (flow.label) {
                label = flow.label + ': ';
            }
            this.out += this.indent() + label + Purdy.stringify(flow.task) + '\n';
            return;
        }

        this.label(flow);

        for (let i = 0; i < flow.task._children.length; ++i) {
            const child = flow.task._children[i];
            this.indentLevel += 4;
            this.traverse(child);
            this.indentLevel -= 4;
        }

    };

    label (flow) {

        if (!flow.label) {
            return;
        }

        const style = flow.task._style || 'waterfall';

        if (typeof(flow.task) === 'function') {
            this.out += this.indent() + `${flow.label}: \n`;
            return
        }

        let depends = '';
        if (flow.depends.length > 0) {
            depends = ' (' + flow.depends.join(', ') + ')';
        }

        this.out += this.indent() + `${flow.label} [${style}]${depends}: \n`;
    };

    indent () {

        const level = this.indentLevel;
        let out = '';
        for (let i = 0; i < level; ++i) {
            out = out + ' ';
        }

        return out;
    };
}

module.exports = Tree;
