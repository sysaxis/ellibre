
window.createTemplate = createTemplate;

/**
 * Create a template in html:
 * 1) Name the template using the attribute 'id'.
 * 2) Mark the style attributes position to 'absolute' and visibility to 'hidden'.
 * 3) Name it's decendants using the attribute 'name'.
 * The function will create a cloned DOM element where it's decendants are easily accessible by their names.
 */
function createTemplate(elementName) {
    var sourceNode = document.getElementById(elementName);
    if (!sourceNode) throw new Error('Template not found');
    var node = sourceNode.cloneNode(true);
    delete node.id;
    node.style.visibility = 'visible';
    node.style.position = 'static';
    
    function bindChild(node) {
        for(var k in node.children) {
            var child = node.children[k];
            var nameAttribute = child.attributes && child.attributes.name;
            if (nameAttribute) node[nameAttribute.value] = child;
            if (child.children && child.children.length) bindChild(child);
        }
    }
    bindChild(node);
    return node;
}
