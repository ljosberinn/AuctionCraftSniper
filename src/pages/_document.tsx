import Document, { Html, Head, Main, NextScript } from "next/document";

// eslint-disable-next-line import/no-default-export
export default function CustomDocument(): JSX.Element {
  return (
    <Html dir="auto">
      <Head>
        <meta content="7 days" name="revisit-after" />
        <meta content="Gerrit Alex" name="author" />
        <script src="https://wow.zamimg.com/widgets/power.js" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `const whTooltips = {colorLinks: true, iconizeLinks: true, renameLinks: true};`,
          }}
        />
      </body>
    </Html>
  );
}

// eslint-disable-next-line @typescript-eslint/unbound-method
CustomDocument.renderDocument = Document.renderDocument;
// eslint-disable-next-line @typescript-eslint/unbound-method
CustomDocument.getInitialProps = Document.getInitialProps;
