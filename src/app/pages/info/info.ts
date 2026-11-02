import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
@Component({
    standalone: true,
    imports: [RouterLink],
    template: `<article>
        <h1>{{ privacy ? 'Privacy and saved drafts' : 'About JSON & Markdown Formatter' }}</h1>
        @if (privacy) {
            <p>
                JSON formatting, Markdown rendering and conversions run in your browser. Local files
                selected with Open File are read on your device; this app does not upload them to a
                conversion server.
            </p>
            <h2>Saved drafts on this device</h2>
            <p>
                The last valid JSON and last Markdown document are saved in browser local storage
                and may remain after you close the tab. Clear in a tool removes its saved draft. You
                can remove both drafts below, or clear this site's data in your browser settings.
            </p>
            <button type="button" (click)="clearDrafts()">
                Delete saved JSON and Markdown drafts
            </button>
            <p role="status">{{ status }}</p>
            <h2>Sharing documents</h2>
            <p>
                New share links encode the document in the URL fragment after #. Encoding is not
                encryption: anyone with the link can read the document. The fragment is not sent in
                the page's HTTP request, but the link can be kept in browser history or by anyone
                you share it with. Older links using ?json= or ?md= may send their content in server
                requests. Do not share secrets, credentials or private records.
            </p>
            <h2>Network requests</h2>
            <p>
                The hosting provider serves the application and may process request information such
                as IP addresses and access logs. The icon font is loaded from Google Fonts. Markdown
                images with external URLs can make requests to those image hosts. A no-referrer
                policy is set to reduce URL disclosure. The source currently includes no document
                analytics or advertising scripts.
            </p>
            <h2>Your controls</h2>
            <p>
                Download a file to keep your work. Clear removes the tool draft; deleting browser
                history or messages containing a share link is a separate action. Avoid using
                sensitive data on shared devices.
            </p>
        } @else {
            <p>
                JSON & Markdown Formatter is a free browser tool for exploring API data, editing
                Markdown and moving tables between JSON, CSV and Markdown.
            </p>
            <h2>What you can do</h2>
            <p>
                Validate and repair JSON, inspect nested arrays, preview Markdown, and create
                initial TypeScript, Go, Python Pydantic and PostgreSQL definitions from sample data.
            </p>
            <h2>Accuracy and feedback</h2>
            <p>
                Generated code and repaired data need review. A sample cannot describe every
                possible response from an API. The tool pages explain current limitations and
                include examples.
            </p>
            <p>
                <a href="https://github.com/arpan234/json-explorer-arpan"
                    >View the project on GitHub</a
                >
                to inspect the source or report a reproducible issue. Include a small non-sensitive
                example, the expected output and your browser version.
            </p>
        }
        <p><a routerLink="/">JSON tools</a> · <a routerLink="/markdown">Markdown editor</a></p>
    </article>`,
    styles: [
        'article{max-width:850px;margin:0 auto;padding:32px 20px;line-height:1.7}h1{line-height:1.25}h2{font-size:1.2rem}a{color:var(--mat-sys-primary)}button{padding:12px;cursor:pointer}',
    ],
})
export class InfoComponent {
    readonly privacy = inject(ActivatedRoute).snapshot.routeConfig?.path === 'privacy';
    status = '';
    clearDrafts(): void {
        try {
            localStorage.removeItem('json_md_last_json');
            localStorage.removeItem('json_md_last_md');
            this.status = 'Saved drafts deleted from this browser.';
        } catch {
            this.status = 'Storage is unavailable. Use your browser settings to clear site data.';
        }
    }
}
