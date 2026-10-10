```rust
//! # Stacker News Monetization Runtime
//!
//! The `sn-monetization-runtime` crate provides on-chain logic for
//! Stackers News' monetization mechanisms.

#![cfg_attr(not(feature = "std"), no_std)]

pub mod types;
pub mod oracle;
pub mod radar;

use sp_std::prelude::*;
use sp_runtime::traits::AccountIdConversion;
use frame_support::{
    pallet_prelude::*,
    traits::ReservableCurrency,
};

#[cfg(test)]
mod tests;

#[cfg(test)]
mod mock;

pub use pallet::*;

type NegativeImbalanceOf<T> = <Balances<T> as ReservableCurrency<AccountIdOf<T>>>::NegativeImbalance;

#[frame_support::pallet]
pub mod pallet {
    use super::*;
    use frame_support::pallet_prelude::*;
    use frame_system::pallet_prelude::*;

    #[pallet::config]
    pub trait Config: frame_system::Config + pallet_balances::Config {
        type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;
        type Currency: ReservableCurrency<Self::AccountId>;
        type MaxStackerTags: Get<u32>;
        type MaxPostsPerDay: Get<u32>;
        type MinimumStake: Get<BalanceOf<Self>>;
        type RadarRewardPercentage: Get<u8>;
        type OracleOrigin: EnsureOrigin<Self::RuntimeOrigin>;
        type ProtocolTreasury: Get<Self::AccountId>;
    }

    #[pallet::pallet]
    pub struct Pallet<T>(_);

    #[pallet::storage]
    #[pallet::getter(fn stackers)]
    pub type Stackers<T: Config> = StorageMap<_, Twox64Concat, T::AccountId, StackerInfo<T>>;

    #[pallet::storage]
    #[pallet::getter(fn posts)]
    pub type Posts<T: Config> = StorageDoubleMap<
        _,
        Twox64Concat, T::AccountId,
        Twox64Concat, T::BlockNumber,
        PostInfo<T>,
    >;

    #[pallet::storage]
    #[pallet::getter(fn radar_entries)]
    pub type RadarEntries<T: Config> = StorageMap<_, Twox64Concat, u64, RadarEntry>;

    #[pallet::storage]
    #[pallet::getter(fn radar_next_id)]
    pub type RadarNextId<T: Config> = StorageValue<_, u64, ValueQuery>;

    #[pallet::event]
    #[pallet::generate_deposit(pub(super) fn deposit_event)]
    pub enum Event<T: Config>: IsEvent {
        StakerRegistered { account: T::AccountId, stake: BalanceOf<T> },
        StakeIncreased { account: T::AccountId, amount: BalanceOf<T> },
        PostCreated { author: T::AccountId, created_at: T::BlockNumber },
        BountyDetected { bounty_id: u64, source: Vec<u8>, score: u32 },
        RadarClaimed { account: T::AccountId, bounty_id: u64, reward: BalanceOf<T> },
    }

    #[pallet::error]
    pub enum Error<T> {
        AlreadyRegistered,
        StakeTooLow,
        MaxPostsPerDayReached,
        InvalidBountyData,
        AlreadyClaimed,
    }

    #[derive Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, MaxEncodedLen, TypeInfo]
    pub struct StackerInfo<T: Config> {
        pub stake: BalanceOf<T>,
        pub registered_at: T::BlockNumber,
        pub posts_today: u32,
        pub last_post_date: Option<T::BlockNumber>,
    }

    #[derive Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, MaxEncodedLen, TypeInfo]
    pub struct PostInfo<T: Config> {
        pub content_hash: Vec<u8>,
        pub created_at: T::BlockNumber,
    }

    #[derive Encode, Decode, Clone, PartialEq, Eq, RuntimeDebug, MaxEncodedLen, TypeInfo]
    pub struct RadarEntry {
        pub bounty_id: u64,
        pub source: Vec<u8>,
        pub score: u32,
        pub claimed: bool,
    }

    #[pallet::call]
    impl<T: Config> Pallet<T> {
        #[pallet::call_index(0)]
        #[pallet::weight(10_000)]
        pub fn register(origin: OriginFor<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;
            ensure!(!Stackers::<T>::contains_key(&who), Error<T>::AlreadyRegistered);
            let stake = T::MinimumStake::get();
            <T as Config>::Currency::reserve(&who, stake)?;
            Stackers::<T>::insert(
                &who,
                StackerInfo {
                    stake,
                    registered_at: frame_system::Pallet::<T>::block_number(),
                    posts_today: 0,
                    last_post_date: None,
                },
            );
            Self::deposit_event(Event::StakerRegistered { account: who, stake });
            Ok(())
        }

        #[pallet::call_index(1)]
        #[pallet::weight(10_000)]
        pub fn increase_stake(origin: OriginFor<T>, additional: BalanceOf<T>) -> DispatchResult {
            let who = ensure_signed(origin)?;
            ensure!(Stackers::<T>::contains_key(&who), Error<T>::AlreadyRegistered);
            ensure!(additional >= T::MinimumStake::get(), Error<T>::StakeTooLow);
            <T as Config>::Currency::reserve(&who, additional)?;
            Stackers::<T>::mutate(&who, |s| {
                if let Some(info) = s {
                    info.stake += additional;
                }
            });
            Self::deposit_event(Event::StakeIncreased { account: who, amount: additional });
            Ok(())
        }

        #[pallet::call_index(2)]
        #[pallet::weight(10_000)]
        pub fn create_post(
            origin: OriginFor<T>,
            content_hash: Vec<u8>,
        ) -> DispatchResult {
            let who = ensure_signed(origin)?;
            ensure!(Stackers::<T>::contains_key(&who), Error<T>::AlreadyRegistered);
            let now = frame_system::Pallet::<T>::block_number();
            Stackers::<T>::mutate(&who, |s| {
                if let Some(info) = s {
                    if info.last_post_date == Some(now) {
                        ensure!(info.posts_today < T::MaxPostsPerDay::get(), Error<T>::MaxPostsPerDayReached);
                        info.posts_today += 1;
                    } else {
                        info.posts_today = 1;
                        info.last_post_date = Some(now);
                    }
                }
            });
            Posts::<T>::insert(&who, &now, PostInfo { content_hash, created_at: now });
            Self::deposit_event(Event::PostCreated { author: who, created_at: now });
            Ok(())
        }

        #[pallet::call_index(3)]
        #[pallet::weight(50_000)]
        pub fn detect_radar_bounty(
            origin: OriginFor<T>,
            bounty_data: Vec<u8>,
        ) -> DispatchResult {
            T::OracleOrigin::ensure_origin(origin)?;
            let entry = RadarEntry::decode(&mut &bounty_data[..])
                .map_err(|_| Error<T>::InvalidBountyData)?;
            let id = RadarNextId::<T>::get();
            RadarEntries::<T>::insert(id, entry.clone());
            RadarNextId::<T>::put(id + 1);
            Self::deposit_event(Event::BountyDetected {
                bounty_id: id,
                source: entry.source.clone(),
                score: entry.score,
            });
            Ok(())
        }

        #[pallet::call_index(4)]
        #[pallet::weight(10_000)]
        pub fn claim_radar_reward(origin: OriginFor<T>, bounty_id: u64) -> DispatchResult {
            let who = ensure_signed(origin)?;
            ensure!(Stackers::<T>::contains_key(&who), Error<T>::AlreadyRegistered);
            let mut entry = RadarEntries::<T>::get(bounty_id)
                .ok_or(Error<T>::AlreadyClaimed)?;
            ensure!(!entry.claimed, Error<T>::AlreadyClaimed);
            entry.claimed = true;
            RadarEntries::<T>::insert(bounty_id, entry);
            let reward = T::RadarRewardPercentage::get() as u128
                .saturating_mul(entry.score as u128)
                .saturating_div(100);
            let treasury = T::ProtocolTreasury::get();
            <T as Config>::Currency::transfer(&treasury, &who, reward.into(), ExistenceRequirement::AllowDeath)?;
            Self::deposit_event(Event::RadarClaimed { account: who, bounty_id, reward });
            Ok(())
        }
    }
}
