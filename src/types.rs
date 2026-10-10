```rust
use sp_runtime::RuntimeDebug;
use scale_info::TypeInfo;

pub type BalanceOf<T> = <<T as crate::pallet::Config>::Currency as frame_support::traits::ReservableCurrency<
    <T as frame_system::Config>::AccountId,
>>::Balance;

pub type AccountIdOf<T> = <T as frame_system::Config>::AccountId;

#[derive(RuntimeDebug, PartialEq, Eq, Clone, Encode, Decode, MaxEncodedLen, TypeInfo)]
pub enum BountyStatus {
    Open,
    Closed,
}
