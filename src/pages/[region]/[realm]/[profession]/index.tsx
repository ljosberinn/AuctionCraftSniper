import type { GetStaticPathsResult, GetStaticProps } from "next";
import Head from "next/head";

import {
  getAllProfessionsByLocale,
  getAllRealmsByRegion,
  getRealmDataByName,
  regions,
  retrieveToken,
} from "../../../../bnet/api";
import type { RealmMeta } from "../../../../bnet/realms";
import type { BattleNetRegion } from "../../../../client/context/AuthContext/types";

type ProfessionProps = {
  region: BattleNetRegion;
  profession: string;
  realm: Omit<RealmMeta, "_links">;
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
          {profession} / {region}-{realm.name}
        </title>
      </Head>
      <h1>
        {region} - {realm.name} - {profession}
      </h1>
    </>
  );
}

export const getStaticPaths = async (): Promise<
  GetStaticPathsResult<{ region: string; realm: string; profession: string }>
> => {
  const token = await retrieveToken();

  const allRealms = await Promise.all(
    regions.map(async (region) => ({
      realms: await getAllRealmsByRegion(region, token),
      region,
    }))
  );

  const flatRealms = allRealms.flatMap((data) =>
    data.realms.map((realm) => ({
      params: {
        realm: realm.slug,
        region: data.region,
      },
    }))
  );

  const professionData = await getAllProfessionsByLocale("en_US", token);
  const professionNames = professionData.professions.map((profession) =>
    profession.name.toLocaleLowerCase().split(" ").join("-")
  );

  const paths = flatRealms.flatMap(({ params }) => {
    return professionNames.map((profession) => ({
      params: {
        ...params,
        profession,
      },
    }));
  });

  return {
    fallback: "blocking",
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

  const token = await retrieveToken();
  const realmData = await getRealmDataByName(realm, region, token);

  return {
    props: {
      profession: profession.charAt(0).toUpperCase() + profession.slice(1),
      realm: realmData,
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
