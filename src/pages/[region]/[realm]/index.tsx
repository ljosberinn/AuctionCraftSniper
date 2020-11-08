import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import allProfessions from "../../../../static/professions.json";
import allRealms from "../../../../static/realms.json";
import type { BattleNetRegion } from "../../../client/context/AuthContext/types";

type RealmProps = {
  region: BattleNetRegion;
  realm: typeof allRealms[number];
  professions: typeof allProfessions;
};

// eslint-disable-next-line import/no-default-export
export default function Realm({
  region,
  realm,
  professions,
}: RealmProps): JSX.Element {
  return (
    <>
      <Head>
        <title>
          {region}-{realm.name}
        </title>
      </Head>
      <h1>
        {region} - {realm.name}
      </h1>
      <ul>
        {professions.map((profession) => (
          <li key={profession.id}>
            <Link
              href={`/${region.toLowerCase()}/${realm.slug}/${profession.slug}`}
            >
              {profession.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export const getStaticPaths: GetStaticPaths<{
  region: BattleNetRegion;
  realm: string;
}> = async () => {
  return {
    fallback: false,
    paths: allRealms.map((realm) => ({
      params: {
        realm: realm.slug,
        region: realm.region.slug as BattleNetRegion,
      },
    })),
  };
};

export const getStaticProps: GetStaticProps<RealmProps> = async (ctx) => {
  if (
    !ctx.params?.region ||
    Array.isArray(ctx.params.region) ||
    !ctx.params.realm ||
    Array.isArray(ctx.params.realm)
  ) {
    throw new Error("incorrect getStaticProps");
  }

  const { region, realm } = ctx.params as {
    region: BattleNetRegion;
    realm: string;
  };

  const realmData = allRealms.find(
    (maybeRealm) =>
      maybeRealm.region.slug === region && maybeRealm.slug === realm
  );

  if (!realmData) {
    throw new Error(`unknown realm "${region}-${realm}"`);
  }

  return {
    props: {
      professions: allProfessions,
      realm: realmData,
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
