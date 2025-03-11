export async function aceLoader() {
  try {
    const ace = await import('ace-code');
    await Promise.all([
      // Load the base modules
      import('ace-code/esm-resolver'),
      // Language support
      import('ace-code/src/mode/yaml'),
      // Themes
      import('ace-code/src/theme/cloud_editor'),
      import('ace-code/src/theme/cloud_editor_dark'),
    ]);
    return ace;
  } catch (e) {
    console.error('Failed to load ace editor', e);
    return null;
  }
}
