import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import {
  getAllProfessionsByLocale,
  getAllRealmsByRegion,
  getRealmDataByName,
  regions,
  retrieveToken,
} from "../../../bnet/api";
import type { RealmMeta } from "../../../bnet/realms";
import type { ProfessionMeta } from "../../../bnet/recipes";
import type { BattleNetRegion } from "../../../client/context/AuthContext/types";

type RealmProps = {
  region: BattleNetRegion;
  realm: Omit<RealmMeta, "_links">;
  professions: ProfessionMeta[];
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
      {professions.map((profession) => (
        <ul key={profession.id}>
          <li>
            <Link
              href={`/${region.toLowerCase()}/${realm.slug}/${profession.name}`}
            >
              {profession.name.charAt(0).toUpperCase() +
                profession.name.slice(1)}
            </Link>
          </li>
        </ul>
      ))}
    </>
  );
}

export const getStaticPaths: GetStaticPaths<{
  region: BattleNetRegion;
  realm: string;
}> = async () => {
  const token = await retrieveToken();
  const allRealms = await Promise.all(
    regions.map(async (region) => ({
      realms: await getAllRealmsByRegion(region, token),
      region,
    }))
  );

  const paths = allRealms.flatMap((data) =>
    data.realms.map((realm) => ({
      params: {
        realm: realm.slug,
        region: data.region,
      },
    }))
  );

  return {
    fallback: "blocking",
    paths,
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

  const token = await retrieveToken();
  const realmData = await getRealmDataByName(realm, region, token);
  const professions = await getAllProfessionsByLocale("en_US", token);

  return {
    props: {
      professions: professions.professions.map((profession) => ({
        ...profession,
        name: profession.name.toLocaleLowerCase().split(" ").join("-"),
      })),
      realm: realmData,
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
