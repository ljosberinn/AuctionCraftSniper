import type { GetStaticPathsResult, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";

import allRealms from "../../../static/realms.json";
import { regions } from "../../bnet/api";
import type { BattleNetRegion } from "../../client/context/AuthContext/types";

type RegionProps = {
  region: BattleNetRegion;
  realms: typeof allRealms;
};

// eslint-disable-next-line import/no-default-export
export default function Region({ region, realms }: RegionProps): JSX.Element {
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
  region: string;
}> => ({
  fallback: false,
  paths: regions.map((region) => ({
    params: {
      region,
    },
  })),
});

export const getStaticProps: GetStaticProps<RegionProps> = async (context) => {
  if (!context.params?.region || Array.isArray(context.params.region)) {
    throw new Error("missing region");
  }

  const { region } = context.params as { region: BattleNetRegion };

  return {
    props: {
      realms: allRealms.filter((realm) => realm.region.slug === region),
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
