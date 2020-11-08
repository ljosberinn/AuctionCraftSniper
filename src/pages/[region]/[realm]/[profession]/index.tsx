import type { GetStaticPathsResult, GetStaticProps } from "next";
import Head from "next/head";

import allProfessions from "../../../../../static/professions.json";
import allRealms from "../../../../../static/realms.json";
import type { BattleNetRegion } from "../../../../client/context/AuthContext/types";

type ProfessionProps = {
  region: BattleNetRegion;
  profession: typeof allProfessions[number];
  realm: typeof allRealms[number];
};

// eslint-disable-next-line import/no-default-export
export default function Profession({
  profession,
  realm,
  region,
}: ProfessionProps): JSX.Element {
  return (
    <>
      <Head>
        <title>
          {profession.name} / {region}-{realm.name}
        </title>
      </Head>
      <h1>
        {region} - {realm.name} - {profession.name}
      </h1>
    </>
  );
}

export const getStaticPaths = async (): Promise<
  GetStaticPathsResult<{ region: string; realm: string; profession: string }>
> => {
  const flatRealms = allRealms.map((realm) => ({
    realm: realm.slug,
    region: realm.region.slug as BattleNetRegion,
  }));

  const paths = flatRealms.flatMap(({ realm, region }) => {
    return allProfessions.map((profession) => ({
      params: {
        profession: profession.slug,
        realm,
        region,
      },
    }));
  });

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps: GetStaticProps<ProfessionProps> = async (ctx) => {
  if (
    !ctx.params?.region ||
    Array.isArray(ctx.params.region) ||
    !ctx.params.realm ||
    Array.isArray(ctx.params.realm) ||
    !ctx.params.profession ||
    Array.isArray(ctx.params.profession)
  ) {
    throw new Error("incorrect getStaticProps");
  }

  const { region, realm, profession } = ctx.params as {
    region: BattleNetRegion;
    realm: string;
    profession: string;
  };

  const realmData = allRealms.find(
    (maybeRealm) =>
      maybeRealm.slug === realm && maybeRealm.region.slug === region
  );

  if (!realmData) {
    throw new Error(`unknown realm ${region}-${realm}`);
  }

  const professionData = allProfessions.find(
    (maybeProfession) => maybeProfession.slug === profession
  );

  if (!professionData) {
    throw new Error(`unknown profession ${profession}`);
  }

  return {
    props: {
      profession: professionData,
      realm: realmData,
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
