#! /usr/bin/env node

const { promises: fs } = require( 'fs' );
const path             = require( 'path' );
const libnpm           = require( 'libnpm' );
const bytes            = require( 'bytes' );
const marked           = require( 'marked' );
const pdf              = require( 'html-pdf' );

function packageInformationToRow( info ) {
	const packageName           = info?.manifest?.name;
	const packageVersion        = info?.manifest?.version;
	const lastModified          = new Date( info?.packument?.modified );
	const packageSize           = bytes( info?.packument?._contentLength );
	const packageSearch         = info?.search?.find( ( item ) => item.version === packageVersion );
	const packageDownloadUrl    = packageSearch?.links?.npm.replace( /www./, '' );
	const packageHomepageUrl    = packageSearch?.links?.homepage.replace( /www./, '' );
	const packagePublisherName  = packageSearch?.publisher?.username;
	const packagePublisherEmail = packageSearch?.publisher?.email;

	return [
		packageName,
		`v${ info?.manifest?.version }`,
		lastModified.toLocaleDateString( 'en-US' ),
		packageSize,
		packageDownloadUrl,
		packageHomepageUrl,
		packagePublisherName,
		packagePublisherEmail
	];
}

async function npmInformation() {
	const cwd          = process.cwd();
	const localPackage = path.join( cwd, 'package.json' );

	try {
		await fs.access( localPackage, fs.F_OK );
	}
	catch ( e ) {
		console.error( 'Error - package.json does not exist in this path' );
		process.exit( 1 );
	}

	const rawData       = await fs.readFile( localPackage, 'utf-8' );
	const parsedPackage = JSON.parse( rawData );

	const dependencies = Object.keys( parsedPackage.dependencies );

	const table = [
		[
			'Name',
			'Version',
			'Last Modified',
			'Size',
			'Download Url',
			'Homepage Url',
			'Publisher Name',
			'Publisher Email'
		].join( '|' ),
		[ '|---'.repeat( 8 ), '|' ].join( '' )
	];

	for ( let i = 0; i < dependencies.length; i++ ) {
		const pkg = dependencies[ i ];

		console.log( `gathering information for ${ pkg }` );

		try {
			const manifest  = await libnpm.manifest( pkg );
			const packument = await libnpm.packument( pkg );
			const search    = await libnpm.search( pkg );
			table.push(
				packageInformationToRow( { manifest, packument, search } ).join( '|' )
			);
		}
		catch ( e ) {
			if ( e.statusCode === 404 ) {
				table.push(
					packageInformationToRow( {
						manifest: { name: pkg },
						links: { npm: e.uri }
					} ).join( '|' )
				);
			}
		}
	}

	let html = marked( table.join( '\n' ) );
	html += `
	<style>
	table { font-size: 7px; }
	</style>
	`;

	const outputFile = path.join( cwd, `npm-report-${ parsedPackage.name }-${ parsedPackage.version }.pdf` );
	await new Promise(
		( res, rej ) => pdf.create(
			html,
			{
				format: 'Letter',
				header: {
					height: '45mm',
					contents: `<div>${ parsedPackage.name } v${ parsedPackage.version }</div>`
				}
			}
		)
			.toFile( outputFile, ( e, d ) => e ? rej( e ) : res( d ) )
	);
}

module.exports = npmInformation();
