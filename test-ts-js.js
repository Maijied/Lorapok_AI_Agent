const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');

const parser = new Parser();
parser.setLanguage(JavaScript);

const mockCode = `
class MyTestClass {
    hello() {}
}
function testFunc() {}
`;

const tree = parser.parse(mockCode);
const types = [];
const traverse = (node) => {
    if (!node) return;
    types.push(node.type);
    for (let i = 0; i < node.childCount; i++) {
        traverse(node.child(i));
    }
};
traverse(tree.rootNode);
console.log(types.filter(t => t.includes('class') || t.includes('function') || t.includes('method') || t.includes('ERROR')));
