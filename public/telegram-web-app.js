// Telegram WebApp compatibility script
(function() {
  // For testing in non-Telegram environments
  if (!window.Telegram) {
    console.log("Creating mock Telegram WebApp for testing");
    window.Telegram = {
      WebApp: {
        initData: "mock_init_data",
        initDataUnsafe: {
          user: {
            id: 12345,
            first_name: "Test",
            last_name: "User",
            username: "testuser",
            auth_date: Math.floor(Date.now() / 1000),
            hash: "mock_hash"
          }
        },
        ready: function() {
          console.log("Mock Telegram WebApp ready called");
        },
        expand: function() {
          console.log("Mock Telegram WebApp expand called");
        },
        MainButton: {
          showProgress: function() {},
          hideProgress: function() {}
        },
        close: function() {
          console.log("Mock Telegram WebApp close called");
        },
        showAlert: function(message) {
          alert(message);
        }
      }
    };
  }
})();