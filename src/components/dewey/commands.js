/**
 * Admin navigation command registry.
 *
 * Each command has:
 *   - id:           Matches the WordPress core/commands store ID where applicable.
 *   - label:        Short, user-facing name shown in suggestion chips.
 *   - explanation:  One-line description shown as chip subtext.
 *   - descriptions: Training phrases used for fuzzy matching.
 *   - url:          Relative wp-admin URL to navigate to. Commands without a
 *                   url require core/commands dispatch (editor-only).
 */

import { __ } from '@wordpress/i18n';

export const commands = [
	// ── Posts & pages ────────────────────────────────────────────────────────

	{
		id: 'core/add-new-post',
		label: __( 'Create a new post', 'dewey' ),
		explanation: __( 'Open the editor to write a new blog post.', 'dewey' ),
		descriptions: [
			'write a new post',
			'create a post',
			'new blog post',
			'new article',
			'start a post',
			'add a post',
		],
		url: 'post-new.php',
	},
	{
		id: 'core/add-new-page',
		label: __( 'Create a new page', 'dewey' ),
		explanation: __(
			'Open the editor to create a new static page.',
			'dewey'
		),
		descriptions: [
			'create a new page',
			'new page',
			'add a page',
			'new about page',
			'new contact page',
		],
		url: 'post-new.php?post_type=page',
	},
	{
		id: 'core/manage-posts',
		label: __( 'Manage posts', 'dewey' ),
		explanation: __( 'View and edit your existing blog posts.', 'dewey' ),
		descriptions: [
			'show all posts',
			'view posts',
			'all posts',
			'manage posts',
			'edit posts',
			'post list',
		],
		url: 'edit.php',
	},
	{
		id: 'core/manage-pages',
		label: __( 'Manage pages', 'dewey' ),
		explanation: __( 'View and edit your existing static pages.', 'dewey' ),
		descriptions: [
			'show all pages',
			'view pages',
			'all pages',
			'manage pages',
			'edit pages',
		],
		url: 'edit.php?post_type=page',
	},
	{
		id: 'core/manage-categories',
		label: __( 'Manage categories', 'dewey' ),
		explanation: __( 'Organize your posts into categories.', 'dewey' ),
		descriptions: [
			'manage categories',
			'edit categories',
			'post categories',
			'categories',
		],
		url: 'edit-tags.php?taxonomy=category',
	},
	{
		id: 'core/manage-tags',
		label: __( 'Manage tags', 'dewey' ),
		explanation: __( 'Organize posts with tags.', 'dewey' ),
		descriptions: [ 'manage tags', 'edit tags', 'post tags', 'tags' ],
		url: 'edit-tags.php?taxonomy=post_tag',
	},

	// ── Media ─────────────────────────────────────────────────────────────────

	{
		id: 'core/open-media-library',
		label: __( 'Media library', 'dewey' ),
		explanation: __(
			'View and manage your uploaded images, videos, and files.',
			'dewey'
		),
		descriptions: [
			'media library',
			'images',
			'photos',
			'files',
			'gallery',
			'uploaded files',
			'manage media',
			'find images',
		],
		url: 'upload.php',
	},
	{
		id: 'core/add-new-media',
		label: __( 'Upload media', 'dewey' ),
		explanation: __( 'Upload new files to your media library.', 'dewey' ),
		descriptions: [
			'upload image',
			'upload file',
			'add photo',
			'new video',
			'add media',
			'upload media',
		],
		url: 'media-new.php',
	},

	// ── Appearance ────────────────────────────────────────────────────────────

	{
		id: 'core/open-appearance-themes',
		label: __( 'Themes', 'dewey' ),
		explanation: __( 'Change the look and design of your site.', 'dewey' ),
		descriptions: [
			'themes',
			'change theme',
			'new theme',
			'manage themes',
			'appearance',
			'change design',
			'change look',
		],
		url: 'themes.php',
	},
	{
		id: 'core/open-site-editor',
		label: __( 'Site editor', 'dewey' ),
		explanation: __(
			'Edit your site layout and design globally.',
			'dewey'
		),
		descriptions: [
			'site editor',
			'full site editing',
			'edit site',
			'customize theme',
			'FSE',
		],
		url: 'site-editor.php',
	},
	{
		id: 'core/open-navigation',
		label: __( 'Navigation', 'dewey' ),
		explanation: __( 'Edit your site menus and navigation.', 'dewey' ),
		descriptions: [
			'navigation',
			'site navigation',
			'edit navigation',
			'nav menus',
		],
		url: 'site-editor.php?path=%2Fnavigation',
	},
	{
		id: 'core/open-styles',
		label: __( 'Site styles', 'dewey' ),
		explanation: __( 'Change global colors, fonts, and spacing.', 'dewey' ),
		descriptions: [
			'site styles',
			'global styles',
			'edit styles',
			'change colors',
			'typography',
			'fonts',
		],
		url: 'site-editor.php?path=%2Fstyles',
	},
	{
		id: 'core/open-templates',
		label: __( 'Templates', 'dewey' ),
		explanation: __( 'Edit page and post templates.', 'dewey' ),
		descriptions: [
			'templates',
			'manage templates',
			'edit templates',
			'page templates',
		],
		url: 'site-editor.php?path=%2Ftemplates',
	},
	{
		id: 'core/open-template-parts',
		label: __( 'Template parts', 'dewey' ),
		explanation: __(
			'Edit headers, footers, and other template components.',
			'dewey'
		),
		descriptions: [
			'template parts',
			'edit header',
			'edit footer',
			'header footer',
		],
		url: 'site-editor.php?path=%2Ftemplate-parts',
	},
	{
		id: 'core/open-patterns',
		label: __( 'Patterns', 'dewey' ),
		explanation: __(
			'Create and manage reusable block patterns.',
			'dewey'
		),
		descriptions: [
			'patterns',
			'block patterns',
			'manage patterns',
			'reusable blocks',
		],
		url: 'site-editor.php?path=%2Fpatterns',
	},
	{
		id: 'core/open-appearance-menus',
		label: __( 'Menus', 'dewey' ),
		explanation: __( 'Edit your classic navigation menus.', 'dewey' ),
		descriptions: [
			'menus',
			'navigation menus',
			'edit menus',
			'change menu',
			'nav links',
		],
		url: 'nav-menus.php',
	},
	{
		id: 'core/open-appearance-widgets',
		label: __( 'Widgets', 'dewey' ),
		explanation: __(
			'Edit sidebars and footer areas using widgets.',
			'dewey'
		),
		descriptions: [
			'widgets',
			'sidebar widgets',
			'footer widgets',
			'manage widgets',
			'edit sidebar',
		],
		url: 'widgets.php',
	},
	{
		id: 'core/open-appearance-customizer',
		label: __( 'Customizer', 'dewey' ),
		explanation: __(
			'Customize site appearance with a live preview.',
			'dewey'
		),
		descriptions: [
			'customizer',
			'open customizer',
			'live preview',
			'site identity',
			'header settings',
		],
		url: 'customize.php',
	},

	// ── Users ─────────────────────────────────────────────────────────────────

	{
		id: 'core/manage-users',
		label: __( 'Users', 'dewey' ),
		explanation: __( 'View and manage all site users.', 'dewey' ),
		descriptions: [
			'users',
			'manage users',
			'show users',
			'view team',
			'all users',
			'members',
		],
		url: 'users.php',
	},
	{
		id: 'core/add-new-user',
		label: __( 'Add new user', 'dewey' ),
		explanation: __( 'Create a new user account.', 'dewey' ),
		descriptions: [
			'add user',
			'new user',
			'create user',
			'invite user',
			'new member',
		],
		url: 'user-new.php',
	},
	{
		id: 'core/open-user-profile',
		label: __( 'My profile', 'dewey' ),
		explanation: __( 'Edit your personal account settings.', 'dewey' ),
		descriptions: [
			'my profile',
			'edit profile',
			'account settings',
			'change password',
			'profile page',
		],
		url: 'profile.php',
	},

	// ── Comments ──────────────────────────────────────────────────────────────

	{
		id: 'core/manage-comments',
		label: __( 'Comments', 'dewey' ),
		explanation: __( 'View and moderate site comments.', 'dewey' ),
		descriptions: [
			'comments',
			'manage comments',
			'moderate comments',
			'pending comments',
			'comment moderation',
		],
		url: 'edit-comments.php',
	},

	// ── Plugins ───────────────────────────────────────────────────────────────

	{
		id: 'core/open-plugins',
		label: __( 'Plugins', 'dewey' ),
		explanation: __( 'View and manage your installed plugins.', 'dewey' ),
		descriptions: [
			'plugins',
			'manage plugins',
			'installed plugins',
			'plugin list',
			'activate plugin',
		],
		url: 'plugins.php',
	},
	{
		id: 'core/add-new-plugin',
		label: __( 'Add new plugin', 'dewey' ),
		explanation: __( 'Search for and install new plugins.', 'dewey' ),
		descriptions: [
			'add plugin',
			'install plugin',
			'new plugin',
			'search plugins',
			'plugin search',
		],
		url: 'plugin-install.php',
	},

	// ── Settings ──────────────────────────────────────────────────────────────

	{
		id: 'core/open-settings-general',
		label: __( 'General settings', 'dewey' ),
		explanation: __(
			'Site title, tagline, URL, and core options.',
			'dewey'
		),
		descriptions: [
			'general settings',
			'site title',
			'site name',
			'tagline',
			'change site name',
			'site settings',
		],
		url: 'options-general.php',
	},
	{
		id: 'core/open-settings-writing',
		label: __( 'Writing settings', 'dewey' ),
		explanation: __(
			'Default post category and post-by-email options.',
			'dewey'
		),
		descriptions: [
			'writing settings',
			'default category',
			'post by email',
			'writing options',
		],
		url: 'options-writing.php',
	},
	{
		id: 'core/open-settings-reading',
		label: __( 'Reading settings', 'dewey' ),
		explanation: __(
			'Control how content is displayed to visitors.',
			'dewey'
		),
		descriptions: [
			'reading settings',
			'homepage settings',
			'front page',
			'posts per page',
			'blog settings',
		],
		url: 'options-reading.php',
	},
	{
		id: 'core/open-settings-discussion',
		label: __( 'Discussion settings', 'dewey' ),
		explanation: __(
			'Comment moderation rules and avatar settings.',
			'dewey'
		),
		descriptions: [
			'discussion settings',
			'comment settings',
			'avatars',
			'comment rules',
		],
		url: 'options-discussion.php',
	},
	{
		id: 'core/open-settings-media',
		label: __( 'Media settings', 'dewey' ),
		explanation: __(
			'Manage image sizes and upload organization.',
			'dewey'
		),
		descriptions: [
			'media settings',
			'image sizes',
			'upload folder',
			'thumbnail sizes',
		],
		url: 'options-media.php',
	},
	{
		id: 'core/open-settings-permalinks',
		label: __( 'Permalink settings', 'dewey' ),
		explanation: __( 'Change the URL structure for your site.', 'dewey' ),
		descriptions: [
			'permalinks',
			'permalink settings',
			'url structure',
			'slug settings',
			'url format',
		],
		url: 'options-permalink.php',
	},
	{
		id: 'core/open-settings-privacy',
		label: __( 'Privacy settings', 'dewey' ),
		explanation: __( 'Configure your privacy policy page.', 'dewey' ),
		descriptions: [ 'privacy settings', 'privacy policy', 'gdpr settings' ],
		url: 'options-privacy.php',
	},

	// ── Tools ─────────────────────────────────────────────────────────────────

	{
		id: 'core/open-tools-site-health',
		label: __( 'Site health', 'dewey' ),
		explanation: __(
			'Check your site for performance and security issues.',
			'dewey'
		),
		descriptions: [
			'site health',
			'health check',
			'site check',
			'diagnose site',
			'is site okay',
		],
		url: 'site-health.php',
	},
	{
		id: 'core/open-tools-export',
		label: __( 'Export content', 'dewey' ),
		explanation: __(
			'Download your site content as an XML file.',
			'dewey'
		),
		descriptions: [
			'export content',
			'export site',
			'download content',
			'backup posts',
			'export xml',
		],
		url: 'export.php',
	},
	{
		id: 'core/open-tools-import',
		label: __( 'Import content', 'dewey' ),
		explanation: __( 'Import content from another site.', 'dewey' ),
		descriptions: [
			'import content',
			'import site',
			'upload import',
			'migrate content',
		],
		url: 'import.php',
	},
	{
		id: 'core/open-updates',
		label: __( 'Updates', 'dewey' ),
		explanation: __(
			'Check for WordPress, plugin, and theme updates.',
			'dewey'
		),
		descriptions: [
			'updates',
			'check updates',
			'update wordpress',
			'update plugins',
			'update themes',
			'new versions',
		],
		url: 'update-core.php',
	},

	// ── Dashboard ─────────────────────────────────────────────────────────────

	{
		id: 'core/open-dashboard',
		label: __( 'Dashboard', 'dewey' ),
		explanation: __( 'Return to the main WordPress dashboard.', 'dewey' ),
		descriptions: [
			'dashboard',
			'go home',
			'home page',
			'admin home',
			'wp admin home',
		],
		url: 'index.php',
	},
	{
		id: 'core/view-site',
		label: __( 'View site', 'dewey' ),
		explanation: __( 'Open the public front end of your site.', 'dewey' ),
		descriptions: [
			'view site',
			'visit site',
			'open website',
			'preview site',
			'front end',
			'see my site',
		],
		url: '/',
	},
];
