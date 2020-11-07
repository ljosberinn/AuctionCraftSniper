import type { GetStaticPathsResult, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";

import { getAllRealmsByRegion, regions, retrieveToken } from "../../bnet/api";
import type { Realm } from "../../bnet/realms";
import type { BattleNetRegion } from "../../client/context/AuthContext/types";

type RegionProps = {
  region: BattleNetRegion;
  realms: Omit<Realm, "key">[];
};

// eslint-disable-next-line import/no-default-export
export default function Region({ region, realms }: RegionProps): JSX.Element {
  return (
    <>
      <Head>
        <title>{region}</title>
      </Head>
      <h1>{region}</h1>
      {realms.map((realm) => (
        <ul key={realm.id}>
          <li>
            <Link href={`/${region.toLowerCase()}/${realm.slug}`}>
              {realm.name}
            </Link>
          </li>
        </ul>
      ))}
    </>
  );
}

export const getStaticPaths = (): GetStaticPathsResult<{
  region: string;
}> => ({
  fallback: "blocking",
  paths: regions.map((region) => ({
    params: {
      region,
    },
  })),
});

export const getStaticProps: GetStaticProps<RegionProps> = async (ctx) => {
  if (!ctx.params?.region || Array.isArray(ctx.params.region)) {
    throw new Error("missing region");
  }

  const { region } = ctx.params as { region: BattleNetRegion };

  const access_token = await retrieveToken();
  const realms = await getAllRealmsByRegion(region, access_token);

  return {
    props: {
      realms,
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
