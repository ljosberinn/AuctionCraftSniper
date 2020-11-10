import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ParsedUrlQuery } from "querystring";
import React, { useEffect, useState } from "react";

import { simpleProfessions } from "../../../../static/professions";
import allRealms from "../../../../static/realms.json";
import type { AuctionPartial } from "../../../bnet/recipes";
import type { BattleNetRegion } from "../../../client/context/AuthContext/types";

const allProfessionSlugs = simpleProfessions.map(
  (profession) => profession.slug
);

const getActiveProfessions = ({ professions }: ParsedUrlQuery): string[] => {
  if (Array.isArray(professions)) {
    return professions;
  }

  if (professions) {
    return professions.split(",");
  }

  return allProfessionSlugs;
};

const useInitWowhead = (trigger: boolean) => {
  useEffect(() => {
    // @ts-expect-error loaded via script
    if (trigger && window.$WowheadPower) {
      // @ts-expect-error loaded via script
      $WowheadPower.init();
    }
  }, [trigger]);
};

// eslint-disable-next-line import/no-default-export
export default function Realm({
  region,
  realm,
}: InferGetStaticPropsType<typeof getStaticProps>): JSX.Element {
  const { query } = useRouter();
  const activeProfessions = getActiveProfessions(query);
  const baseUrl = `/${region.toLowerCase()}/${realm.slug}`;
  const [auctionData, setAuctionData] = useState<AuctionPartial[]>([]);

  const hasProfessions = query.professions
    ? query.professions.length > 0
    : false;

  useEffect(() => {
    const params =
      activeProfessions === allProfessionSlugs
        ? ""
        : `?${activeProfessions
            .map((slug) => `professions=${slug}`)
            .join("&")}`;

    if (auctionData.length === 0) {
      fetch(`/api/auctions/${region.toLowerCase()}/${realm.slug}${params}`)
        // eslint-disable-next-line promise/prefer-await-to-then
        .then((response) => response.json())
        // eslint-disable-next-line promise/prefer-await-to-then
        .then(setAuctionData)
        // eslint-disable-next-line no-console
        .catch(console.error);
    }
  }, [realm.slug, region, activeProfessions, auctionData]);

  useInitWowhead(auctionData.length > 0);

  return (
    <>
      <Head>
        <title>
          ACS \ {region}-{realm.name}
        </title>
      </Head>
      <h1>
        {region} - {realm.name}
      </h1>
      <header>
        <nav className="flex">
          {simpleProfessions.map((profession) => {
            const nextParams = (() => {
              if (
                hasProfessions &&
                activeProfessions.includes(profession.slug)
              ) {
                return activeProfessions.filter(
                  (slug) => slug !== profession.slug
                );
              }

              return hasProfessions
                ? [...activeProfessions, profession.slug]
                : [profession.slug];
            })();

            const href = `${baseUrl}${
              nextParams.length > 0
                ? `?professions=${nextParams.join(",")}`
                : ""
            }`;

            const isActive = hasProfessions && href.includes(profession.slug);

            const style =
              hasProfessions && href.includes(profession.slug)
                ? {
                    filter: "grayscale(1)",
                  }
                : {};

            return (
              <Link href={href} key={profession.id}>
                <a>
                  <img
                    src={profession.media}
                    alt={profession.name}
                    className={`${
                      isActive
                        ? "opacity-50 hover:opacity-75 transition duration-100 ease-in-out"
                        : ""
                    }`}
                    style={style}
                  />
                </a>
              </Link>
            );
          })}
        </nav>
      </header>
      <hr />
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="text-right px-6 py-3 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              item id
            </th>
            <th className="text-right px-6 py-3 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              quantity
            </th>
            <th className="text-right px-6 py-3 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              buyout
            </th>
            <th className="text-right px-6 py-3 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
              bid
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {auctionData.map((dataset) => (
            <tr key={dataset.id}>
              <td className="px-6 py-4 whitespace-no-wrap text-right">
                <a
                  href={`https://wowhead.com/?item=${dataset.item.id}`}
                  data-wowhead={`item-${dataset.item.id}`}
                >
                  {dataset.item.id}
                </a>
              </td>
              <td className="px-6 py-4 whitespace-no-wrap text-right">
                {dataset.quantity}
              </td>
              <td className="px-6 py-4 whitespace-no-wrap text-right">
                {(dataset.buyout ?? 0).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-no-wrap text-right">
                {(dataset.bid ?? 0).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

type StaticProps = {
  region: BattleNetRegion;
  realm: Pick<typeof allRealms[number], "id" | "name" | "slug">;
};

type ExpectedUrlParams = {
  region: BattleNetRegion;
  realm: string;
};

export const getStaticProps: GetStaticProps<
  StaticProps,
  ExpectedUrlParams
> = async (context) => {
  if (!context.params?.region || !context.params.realm) {
    throw new Error("incorrect getStaticProps");
  }

  const { region, realm } = context.params;

  const realmData = allRealms.find(
    (maybeRealm) =>
      maybeRealm.region.slug === region && maybeRealm.slug === realm
  );

  if (!realmData) {
    throw new Error(`unknown realm "${region}-${realm}"`);
  }

  const { id, name, slug } = realmData;

  return {
    props: {
      realm: { id, name, slug },
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
