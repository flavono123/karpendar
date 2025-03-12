// ref. https://github.com/cloudscape-design/components/issues/703
export async function aceLoader() {
  try {
    // Import ace from ace-builds instead of ace-code
    const ace = await import('ace-builds');

    // Configure Ace for CSP compatibility and workers
    ace.config.set("useStrictCSP", true);
    ace.config.set("loadWorkerFromBlob", false);

    await Promise.all([
      // Load the base modules
      import('ace-builds/src-noconflict/ext-language_tools'),
      import('ace-builds/src-noconflict/ext-searchbox'),
      // Import CSS
      import('ace-builds/css/ace.css'),
      // Language support
      import('ace-builds/src-noconflict/mode-yaml'),
      // Themes - adjusting to standard themes that are definitely available
      import('ace-builds/src-noconflict/theme-cloud_editor'),
      import('ace-builds/src-noconflict/theme-cloud_editor_dark'),
      import('ace-builds/css/theme/cloud_editor.css'),
      import('ace-builds/css/theme/cloud_editor_dark.css'),
    ]);

    // Import the worker
    const yamlWorkerUrl = await import('ace-builds/src-noconflict/worker-yaml')
      .then(module => module.default || module);

    // Set the worker URL
    ace.config.setModuleUrl('ace/mode/yaml_worker', yamlWorkerUrl);

    return ace;
  } catch (e) {
    console.error('Failed to load ace editor', e);
    return null;
  }
}
