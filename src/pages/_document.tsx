import Document, { Html, Head, Main, NextScript } from "next/document";

// eslint-disable-next-line import/no-default-export
export default function CustomDocument(): JSX.Element {
  return (
    <Html dir="auto">
      <Head>
        <meta content="7 days" name="revisit-after" />
        <meta content="Gerrit Alex" name="author" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// eslint-disable-next-line @typescript-eslint/unbound-method
CustomDocument.renderDocument = Document.renderDocument;
// eslint-disable-next-line @typescript-eslint/unbound-method
CustomDocument.getInitialProps = Document.getInitialProps;
