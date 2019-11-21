class DocumentationEntry {
	usage;
	description;

	constructor(usage = '', description = '') {
		this.usage = usage;
		this.description = description;
	}
}

module.exports = DocumentationEntry;
