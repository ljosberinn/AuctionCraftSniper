import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import React from "react";

import allProfessions from "../../../../static/professions.json";
import allRealms from "../../../../static/realms.json";
import type { BattleNetRegion } from "../../../client/context/AuthContext/types";

type RealmProps = {
  region: BattleNetRegion;
  realm: typeof allRealms[number];
  professions: typeof allProfessions;
};

const getActiveProfessions = (
  { professions }: ParsedUrlQuery,
  allProfessions: RealmProps["professions"]
): string[] => {
  if (Array.isArray(professions)) {
    return professions;
  }

  if (professions) {
    return professions.split(",");
  }

  return allProfessions.map((profession) => profession.slug);
};

// eslint-disable-next-line import/no-default-export
export default function Realm({
  region,
  realm,
  professions,
}: RealmProps): JSX.Element {
  const { query } = useRouter();
  const activeProfessions = getActiveProfessions(query, professions);
  const baseUrl = `/${region.toLowerCase()}/${realm.slug}`;

  const hasProfessions = query.professions
    ? query.professions.length > 0
    : false;

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
      <div>
        {professions.map((profession) => {
          const nextParams = (() => {
            if (hasProfessions && activeProfessions.includes(profession.slug)) {
              return activeProfessions.filter(
                (slug) => slug !== profession.slug
              );
            }

            return hasProfessions
              ? [...activeProfessions, profession.slug]
              : [profession.slug];
          })();

          const href = `${baseUrl}${
            nextParams.length > 0 ? `?professions=${nextParams.join(",")}` : ""
          }`;

          const style =
            hasProfessions && href.includes(profession.slug)
              ? {
                  filter: "grayscale(1)",
                  opacity: 0.7,
                }
              : {};

          return (
            <Link href={href} key={profession.id}>
              <a>
                <img
                  src={profession.media}
                  alt={profession.name}
                  style={style}
                />
              </a>
            </Link>
          );
        })}
      </div>
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
