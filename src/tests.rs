```rust
use crate::*;
use crate::mock::*;
use frame_support::{assert_ok, assert_noop};
use sp_runtime::traits::BadOrigin;

#[test]
fn register_works() {
    new_test_ext().execute_with(|| {
        assert_ok!(SnMonetization::register(RuntimeOrigin::signed(1)));
        assert!(SnMonetization::stackers(1).is_some());
    });
}

#[test]
fn double_register_fails() {
    new_test_ext().execute_with(|| {
        assert_ok!(SnMonetization::register(RuntimeOrigin::signed(1)));
        assert_noop!(
            SnMonetization::register(RuntimeOrigin::signed(1)),
            Error::<Test>::AlreadyRegistered
        );
    });
}

#[test]
fn detect_radar_bounty_works() {
    new_test_ext().execute_with(|| {
        let entry = crate::radar::SnBounty {
            id: 1592079,
            source: "Stacker_Sports".to_string(),
            score: 2632,
            tags: vec!["recent@Stacker_Sports".to_string(), "top@Stacker_Sports".to_string()],
            status: "OPEN_BOUNTY".to_string(),
        };
        let mut encoded = Vec::new();
        entry.encode_to(&mut encoded);
        assert_ok!(SnMonetization::detect_radar_bounty(
            RuntimeOrigin::root(),
            encoded
        ));
        assert!(SnMonetization::radar_entries(0).is_some());
    });
}
