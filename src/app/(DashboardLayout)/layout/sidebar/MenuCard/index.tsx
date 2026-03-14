import PropTypes from "prop-types";
import { memo, useEffect, useState } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Fab from "@mui/material/Fab";

// assets
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import WhatsAppButton from "./WhatsAppIcon";

// ==============================|| PROGRESS BAR WITH LABEL ||============================== //

interface LinearProgressWithLabelProps {
  value: number;
  [key: string]: any;
}

function LinearProgressWithLabel({ value, ...others }: LinearProgressWithLabelProps) {

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= value) {
          clearInterval(timer);
          return value;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Stack sx={{ gap: 1 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between"}}>
        <Typography
          variant="h6"
          sx={{
            color: "#3b82f6",
            fontWeight: "bold",
          }}
        >
          AI and Inventory Agent
        </Typography>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={progress}
        {...others}
        sx={{
          height: 10,
          borderRadius: 30,
          [`&.${linearProgressClasses.colorPrimary}`]: {
            bgcolor: "background.default",
          },
          [`& .${linearProgressClasses.bar}`]: {
            borderRadius: 5,
            bgcolor: "secondary.dark",
          },
        }}
      />
    </Stack>
  );
}

// ==============================|| SIDEBAR - MENU CARD ||============================== //

function MenuCard() {
  const theme = useTheme();

  return (
    <Card
      className="menu-card"
      sx={{
        bgcolor: "secondary.light",
        mb: 2.75,
        overflow: "hidden",
        position: "fixed",
        right: "81%",
        zIndex: 1900,
        top: "75%",
        transition: "opacity 0.3s ease-in-out",
        "&:after": {
          content: '""',
          position: "absolute",
          width: 157,
          height: 157,
          bgcolor: "secondary.dark",
          borderRadius: "50%",
          top: -115,
          right: -96,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <List disablePadding sx={{ pb: 0 }}>
          <ListItem alignItems="flex-start" disableGutters disablePadding>
            <ListItemAvatar>
              <WhatsAppButton />
            </ListItemAvatar>
            <ListItemText
              sx={{ mt: 0 }}
              primary={
                <Typography
                  variant="h4"
                  sx={{
                    color: "#0aae12ff",
                    mt: 1.5,
                    ml: 2.5,
                  }}
                >
                  WhatsApp
                </Typography>
              }
              secondary={
                <Typography
                  variant="subtitle1"
                  sx={{ color: "success.darker", fontWeight: "bold" }}
                >
                  Automated Assistant
                </Typography>
              }
            />
          </ListItem>
        </List>
        <LinearProgressWithLabel value={100} />
      </Box>
    </Card>
  );
}

export default memo(MenuCard);

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number,
  others: PropTypes.any,
};
