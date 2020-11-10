import type {
  GetStaticPathsResult,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";

import allRealms from "../../../static/realms.json";
import { regions } from "../../bnet/api";
import type { BattleNetRegion } from "../../client/context/AuthContext/types";

// eslint-disable-next-line import/no-default-export
export default function Region({
  region,
  realms,
}: InferGetStaticPropsType<typeof getStaticProps>): JSX.Element {
  return (
    <>
      <Head>
        <title>{region}</title>
      </Head>
      <h1>{region}</h1>
      <ul>
        {realms.map((realm) => (
          <li key={realm.id}>
            <Link href={`/${region.toLowerCase()}/${realm.slug}`}>
              <a>{realm.name}</a>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export const getStaticPaths = (): GetStaticPathsResult<{
  region: BattleNetRegion;
}> => ({
  fallback: false,
  paths: regions.map((region) => ({
    params: {
      region,
    },
  })),
});

type StaticProps = {
  region: BattleNetRegion;
  realms: Pick<typeof allRealms[number], "id" | "slug" | "name">[];
};

type ExpectedUrlParams = {
  region: BattleNetRegion;
};

export const getStaticProps: GetStaticProps<
  StaticProps,
  ExpectedUrlParams
> = async (context) => {
  if (!context.params?.region) {
    throw new Error("missing region");
  }

  const { region } = context.params;

  return {
    props: {
      realms: allRealms
        .filter((realm) => realm.region.slug === region)
        .map(({ id, slug, name }) => ({ id, name, slug })),
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
